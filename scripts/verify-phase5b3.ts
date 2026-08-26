// ============================================================
// ForgeFitOS — Phase 5B.3 deterministic verification harness
// Verifies the Today Energy Balance widget: the presentation model
// (daily intake vs multi-week trajectory kept distinct), activity
// context pass-through, structured confidence copy, the
// maintenance-range gating (range at high confidence only, note at
// moderate, nothing below — never a point estimate), the empty
// states, and the absolute boundaries: no session-calorie totals,
// no "calories burned", no eat-back, no recommendations, no
// migration 020, no Coach/Progress changes. The view-model math
// executes at RUNTIME against the real libs.
// Run from the repository root:
//   npx tsx scripts/verify-phase5b3.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  buildTodayEnergyBalance,
  classifyTrajectory,
  confidenceMessageFor,
} from '../src/lib/today-energy'
import type { TodayEnergyBalanceViewModel } from '../src/lib/today-energy'
import {
  buildDailyNutritionFactsWithContext,
  computeWeightTrend,
} from '../src/lib/energy-facts'
import type { WeeklyWeightAnchor, WeightTrendFact } from '../src/lib/energy-facts'
import {
  estimateBaselineTdee,
  buildQualifyingWeeks,
  inferAdaptiveMaintenance,
} from '../src/lib/energy-model'
import type { AdaptiveMaintenanceEstimate } from '../src/lib/energy-model'

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

const lib = read('src/lib/today-energy.ts')
const card = read('src/components/dashboard/EnergyBalanceCard.tsx')
const page = read('src/app/(app)/dashboard/page.tsx')
const widget = read('src/components/dashboard/TodayWidget.tsx')
const notes = read('docs/phase5b3-energy-widget-notes.md')

const CHANGED = [lib, card, page, widget]

// ── Fixture builders (reusing the real 5B.2 pipeline) ────────────────
const MONDAYS = ['2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03']
const WINDOW_START = '2026-07-13'
const WINDOW_END = '2026-08-09'
const dayOf = (monday: string, offset: number) => {
  const d = new Date(`${monday}T12:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const food = (date: string, calories: number) => ({
  logged_date: date, calories, protein_g: 30, carbs_g: 40, fat_g: 15,
})
const anchor = (weekStart: string, lbs: number): WeeklyWeightAnchor => ({
  weekStart, anchorLbs: lbs, contributingDates: 1, quality: 'single',
})
const BASELINE = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'moderately_active' })

function adaptiveFor(anchorsByWeek: Array<number | null>, cal = 2000): AdaptiveMaintenanceEstimate {
  const rows = MONDAYS.flatMap((m) =>
    Array.from({ length: 5 }, (_, i) => {
      const date = dayOf(m, i)
      return [food(date, Math.round(cal * 0.6)), food(date, cal - Math.round(cal * 0.6))]
    }).flat())
  const facts = buildDailyNutritionFactsWithContext(rows, WINDOW_START, WINDOW_END, {
    targetHistory: [{ effective_date: '2026-06-01', calories: 2000 }],
    explicitCompleteDates: new Set(MONDAYS.flatMap((m) =>
      Array.from({ length: 5 }, (_, i) => dayOf(m, i)))),
  })
  const anchors = MONDAYS
    .map((m, i) => anchorsByWeek[i] !== null ? anchor(m, anchorsByWeek[i] as number) : null)
    .filter((a): a is WeeklyWeightAnchor => a !== null)
  const weeks = buildQualifyingWeeks({ nutritionFacts: facts, anchors, endDate: WINDOW_END })
  return inferAdaptiveMaintenance({ baseline: BASELINE, weeks, daysSinceTargetChange: null })
}

const HIGH_ADAPTIVE = adaptiveFor([190, 189, 188, 187])           // -1 lb/wk, 4 wks
const OBSERVING_ADAPTIVE = adaptiveFor([null, 190, 189, 188])     // 3 wks
const INSUFFICIENT_ADAPTIVE = adaptiveFor([null, null, null, 187])
const trendOf = (a: AdaptiveMaintenanceEstimate): WeightTrendFact => a.weightTrend

const vm = (overrides: Partial<Parameters<typeof buildTodayEnergyBalance>[0]> = {}): TodayEnergyBalanceViewModel =>
  buildTodayEnergyBalance({
    todayCalories: 1850,
    targetCalories: 2100,
    goal: 'fat_loss',
    bfPct: 22,
    activityContext: 'normal',
    adaptive: HIGH_ADAPTIVE,
    energyConfidence: { level: 'high', reasons: [] },
    ...overrides,
  })

// ── 1. Checkpoint and boundary ───────────────────────────────────────
console.log('\n1. Checkpoint and boundary')
{
  check('checkpoint artifacts exist (1c18506 tree)',
    ['scripts/verify-phase5b2.ts', 'docs/phase5b2-adaptive-maintenance-notes.md',
      'supabase/migrations/019_phase5b2_nutrition_day_status.sql',
      'src/components/food/DayCompleteToggle.tsx']
      .every((f) => existsSync(f)))
  check('5B.3 notes exist', notes.length > 2500)
  // RETARGET (UI-3): 020 is the approved dashboard-prefs migration.
  // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
  check('migration boundary: exactly 22 (021 = UI-5B1B ordering; 022 = UI-5B2 reuse)',
    // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
    // workout-reuse migration (create_routine_from_workout +
    // repeat_workout). The boundary moves from exactly-21 to
    // exactly-22; no other migration may appear.
    (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&
    readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
  check('no new persisted facts',
    CHANGED.every((f) => !stripComments(f).includes('energy_balance_snapshots') &&
      !stripComments(f).includes('adaptive_tdee_state')))
  check('exactly 4 feature files carry 5B.3 markers',
    ['src/lib/today-energy.ts', 'src/components/dashboard/EnergyBalanceCard.tsx',
      'src/app/(app)/dashboard/page.tsx', 'src/components/dashboard/TodayWidget.tsx']
      .every((f) => read(f).includes('5B.3')))
  // RETARGETED (5B.4): the weigh-in gate became the documented weekly
  // anchor gate in the approved Coach-integration phase. 5B.3's
  // surviving claim: the BANDS it reads are unmodified and 5B.3
  // itself changed nothing in 3E.
  check('goal-adjustment bands unmodified (read-only from 5B.3)',
    read('src/lib/goal-adjustments.ts').includes('if (bfPct !== null && bfPct >= 20) return { minPct: 0.5, maxPct: 1.25 }') &&
    read('src/lib/goal-adjustments.ts').includes('MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT'))
  check('no decision_logs writes anywhere in scope',
    CHANGED.every((f) => !stripComments(f).includes('decision_logs')))
  check('no nutrition target writes',
    !/nutrition_targets'\)[\s\S]{0,120}\.(insert|update|upsert|delete)/.test(lib))
  check('no Progress chart changes',
    !read('src/app/(app)/progress/page.tsx').includes('5B.3') &&
    !read('src/lib/progress-charts.ts').includes('energy'))
  check('check-in untouched', !read('src/app/(app)/check-in/page.tsx').includes('5B.3'))
  check('5B.2 day-status feature untouched',
    !read('src/components/food/DayCompleteToggle.tsx').includes('5B.3') &&
    !read('src/app/api/nutrition/day-status/route.ts').includes('5B.3'))
}

// ── 2. Runtime: calorie state (daily, distinct from trajectory) ──────
console.log('\n2. Runtime: calorie state')
{
  check('runtime: consumed/target pass through verbatim',
    (() => { const m = vm(); return m.caloriesConsumed === 1850 && m.calorieTarget === 2100 })())
  check('runtime: no target -> no_target with null target',
    (() => {
      const m = vm({ targetCalories: null })
      return m.calorieState === 'no_target' && m.calorieTarget === null
    })())
  check('runtime: invalid target treated as missing',
    vm({ targetCalories: 0 }).calorieState === 'no_target' &&
    vm({ targetCalories: -50 }).calorieState === 'no_target')
  check('runtime: no food -> no_food with null consumed (never fake zero)',
    (() => {
      const m = vm({ todayCalories: null })
      return m.calorieState === 'no_food' && m.caloriesConsumed === null
    })())
  check('runtime: no target takes precedence over no food (setup first)',
    vm({ todayCalories: null, targetCalories: null }).calorieState === 'no_target')
  check('runtime: under beyond the 10% band', vm({ todayCalories: 1500 }).calorieState === 'under')
  check('runtime: near inside the band', vm({ todayCalories: 2000 }).calorieState === 'near')
  check('runtime: over beyond the band', vm({ todayCalories: 2400 }).calorieState === 'over')
  check('runtime: float-exact band edge (2,310 vs 2,100 is exactly 10% -> near)',
    vm({ todayCalories: 2310 }).calorieState === 'near' &&
    vm({ todayCalories: 2311 }).calorieState === 'over')
  check('runtime: daily state and trajectory are SEPARATE fields',
    (() => {
      const m = vm({ todayCalories: 2400 }) // over today...
      return m.calorieState === 'over' && m.trajectoryState === 'on_track' // ...trend still on track
    })())
}

// ── 3. Runtime: activity context ─────────────────────────────────────
console.log('\n3. Runtime: activity context')
{
  for (const ctx of ['low', 'normal', 'high', 'unknown'] as const) {
    check(`runtime: activity context '${ctx}' passes through untouched`,
      vm({ activityContext: ctx }).activityContext === ctx)
  }
  check('card: unknown context reads as honest copy, not zero',
    card.includes("unknown: 'Not enough activity history'"))
  check('card: no hard-coded step judgments in the component',
    !card.includes('steps') && !/\d{4,}/.test(stripComments(card)))
}

// ── 4. Runtime: trajectory classification ────────────────────────────
console.log('\n4. Runtime: trajectory')
{
  const losing = trendOf(HIGH_ADAPTIVE)   // ~-0.53%/wk at 190 lbs
  check('runtime: insufficient trend -> not_enough_data',
    (() => {
      const t = classifyTrajectory('fat_loss', 22, trendOf(INSUFFICIENT_ADAPTIVE))
      return t.state === 'not_enough_data' && t.label === 'Not enough data'
    })())
  check('runtime: fat_loss inside the bf>=20 band (0.5-1.25) -> on_track',
    (() => {
      const t = classifyTrajectory('fat_loss', 22, losing)
      return t.state === 'on_track' && t.label === 'On track'
    })())
  check('runtime: the SAME rate under the lean bf<10 band (0.25-0.5) -> watching',
    classifyTrajectory('fat_loss', 8, losing).state === 'watching')
  check('runtime: fat_loss losing too slowly -> watching',
    (() => {
      const slow = computeWeightTrend([
        anchor('2026-07-13', 190), anchor('2026-07-20', 189.9),
        anchor('2026-07-27', 189.8), anchor('2026-08-03', 189.7),
      ])
      return classifyTrajectory('fat_loss', 22, slow).state === 'watching'
    })())
  check('runtime: fat_loss losing too fast -> watching',
    (() => {
      const fast = computeWeightTrend([
        anchor('2026-07-13', 195), anchor('2026-07-20', 192.4),
        anchor('2026-07-27', 189.8), anchor('2026-08-03', 187.2),
      ])
      return classifyTrajectory('fat_loss', 22, fast).state === 'watching'
    })())
  check('runtime: unknown body fat uses the moderate default band',
    (() => {
      // -1 lb/wk at ~188 = ~0.53%/wk: inside 0.5-1.0 default.
      const t = classifyTrajectory('fat_loss', null, losing)
      return t.state === 'on_track'
    })())
  check('runtime: muscle_gain inside GAIN_BAND -> on_track',
    (() => {
      const gaining = computeWeightTrend([
        anchor('2026-07-13', 186.8), anchor('2026-07-20', 187.2),
        anchor('2026-07-27', 187.6), anchor('2026-08-03', 188),
      ])
      return classifyTrajectory('muscle_gain', null, gaining).state === 'on_track' &&
        classifyTrajectory('strength', null, gaining).state === 'on_track'
    })())
  check('runtime: muscle_gain LOSING weight -> watching',
    classifyTrajectory('muscle_gain', null, losing).state === 'watching')
  check('runtime: maintenance holding -> on_track',
    (() => {
      const flat = computeWeightTrend([
        anchor('2026-07-13', 189), anchor('2026-07-20', 189.1),
        anchor('2026-07-27', 188.9), anchor('2026-08-03', 189),
      ])
      return classifyTrajectory('maintenance', null, flat).state === 'on_track'
    })())
  check('runtime: maintenance drifting -> watching',
    classifyTrajectory('maintenance', null, losing).state === 'watching')
  check('runtime: unsupported goals get DESCRIPTIVE labels, never judgments',
    (() => {
      const down = classifyTrajectory('running', null, losing)
      const flat = computeWeightTrend([
        anchor('2026-07-13', 189), anchor('2026-07-20', 189.05),
        anchor('2026-07-27', 188.95), anchor('2026-08-03', 189),
      ])
      const stable = classifyTrajectory('recomposition', null, flat)
      return down.state === 'trend_only' && down.label === 'Trending down' &&
        stable.state === 'trend_only' && stable.label === 'Stable'
    })())
  check('runtime: unknown goal also descriptive',
    classifyTrajectory(null, null, losing).state === 'trend_only')
  check('static: bands come from 3E verbatim (no parallel engine)',
    lib.includes("import { fatLossBand, GAIN_BAND } from '@/lib/goal-adjustments'") &&
    !lib.includes('minPct: 0.5') && !lib.includes('maxPct: 1.25'))
}

// ── 5. Runtime: confidence copy ──────────────────────────────────────
console.log('\n5. Runtime: confidence copy')
{
  check('runtime: weigh-in evidence gap -> "Need another weekly weigh-in"',
    confidenceMessageFor(['insufficient_weight_anchors']) === 'Need another weekly weigh-in' &&
    confidenceMessageFor(['weight_trend_low_confidence']) === 'Need another weekly weigh-in')
  check('runtime: incomplete nutrition -> explicit-logging copy',
    confidenceMessageFor(['nutrition_logging_incomplete']) ===
      'Mark completed food-log days to improve your estimate')
  check('runtime: recent target change copy',
    confidenceMessageFor(['recent_target_change']) ===
      'Targets changed recently — estimates are resettling')
  check('runtime: activity baseline copy',
    confidenceMessageFor(['no_activity_baseline']) ===
      'Log steps or activity to build your baseline')
  check('runtime: priority — weight evidence beats nutrition beats the rest',
    confidenceMessageFor(['no_activity_baseline', 'nutrition_logging_incomplete',
      'insufficient_weight_anchors']) === 'Need another weekly weigh-in' &&
    confidenceMessageFor(['no_activity_baseline', 'nutrition_logging_incomplete']) ===
      'Mark completed food-log days to improve your estimate')
  check('runtime: no reasons -> null (no fabricated prose)',
    confidenceMessageFor([]) === null)
  check('runtime: unknown reason codes -> null, never invented copy',
    confidenceMessageFor(['some_future_code']) === null)
  check('runtime: confidence level passes through',
    vm({ energyConfidence: { level: 'low', reasons: ['insufficient_weight_anchors'] } })
      .confidenceLevel === 'low')
  check('runtime: message wired from reasons',
    vm({ energyConfidence: { level: 'low', reasons: ['insufficient_weight_anchors'] } })
      .confidenceMessage === 'Need another weekly weigh-in')
}

// ── 6. Runtime: maintenance range gating ─────────────────────────────
console.log('\n6. Runtime: maintenance range')
{
  check('runtime: HIGH confidence -> the range surfaces (canonical [2400, 2600])',
    (() => {
      const m = vm()
      return HIGH_ADAPTIVE.status === 'high_confidence' &&
        m.maintenanceRange !== null &&
        m.maintenanceRange[0] === 2400 && m.maintenanceRange[1] === 2600 &&
        m.maintenanceNote === null
    })())
  check('runtime: range is a genuine RANGE, never a point',
    (() => {
      const m = vm()
      return m.maintenanceRange !== null && m.maintenanceRange[0] < m.maintenanceRange[1]
    })())
  check('runtime: range bounds are rounded to the 5B.2 boundaries (50s)',
    (() => {
      const m = vm()
      return m.maintenanceRange !== null &&
        m.maintenanceRange[0] % 50 === 0 && m.maintenanceRange[1] % 50 === 0
    })())
  check('runtime: MODERATE -> settling note, NO numbers',
    (() => {
      const moderate = { ...HIGH_ADAPTIVE, status: 'moderate_confidence' as const }
      const m = vm({ adaptive: moderate })
      return m.maintenanceRange === null &&
        m.maintenanceNote === 'Maintenance estimate is still settling'
    })())
  check('runtime: OBSERVING -> nothing at all',
    (() => {
      const m = vm({ adaptive: OBSERVING_ADAPTIVE })
      return OBSERVING_ADAPTIVE.status === 'observing' &&
        m.maintenanceRange === null && m.maintenanceNote === null
    })())
  check('runtime: INSUFFICIENT -> nothing at all',
    (() => {
      const m = vm({ adaptive: INSUFFICIENT_ADAPTIVE })
      return INSUFFICIENT_ADAPTIVE.status === 'insufficient_data' &&
        m.maintenanceRange === null && m.maintenanceNote === null
    })())
  check('static: the card renders the range only from the model (no recompute)',
    card.includes('{model.maintenanceRange && (') &&
    card.includes('model.maintenanceRange[0].toLocaleString()') &&
    !card.includes('adaptiveCentral'))
  check('static: no point-estimate rendering anywhere (kcal/day always a range)',
    card.includes('&ndash;') && !/\{\s*model\.observedMaintenance/.test(card))
  check('runtime: builder is pure and repeatable',
    JSON.stringify(vm()) === JSON.stringify(vm()))
}

// ── 7. Card UI ───────────────────────────────────────────────────────
console.log('\n7. Card UI')
{
  check('card exists with the Energy Balance heading',
    card.includes("'Energy Balance'") || card.includes('>Energy Balance<'))
  check('professional icon from the existing library, decorative',
    card.includes("import { Gauge } from 'lucide-react'") &&
    card.includes('<Gauge className="w-4 h-4 text-ink-muted" aria-hidden="true" />'))
  check('no emoji/pictographs anywhere in scope',
    CHANGED.every((f) => !EMOJI.test(f)))
  check('daily calories rendered as consumed / target',
    card.includes('{model.caloriesConsumed!.toLocaleString()}') &&
    card.includes('/ {model.calorieTarget!.toLocaleString()}'))
  check('empty state: no food', card.includes('Start logging food to see today'))
  check('empty state: no target', card.includes('Set your nutrition targets to track energy balance.'))
  check('empty state: trend copy', card.includes('still learning your trend'))
  check('confidence message rendered only when present',
    card.includes('{model.confidenceMessage && ('))
  check('stacked compact rows (no dense 4-column layout)',
    (card.match(/flex items-baseline justify-between/g) || []).length === 3 &&
    !card.includes('grid-cols-4'))
  check('state never encoded by color alone (labels are text)',
    card.includes('ACTIVITY_LABELS') && card.includes('CONFIDENCE_LABELS') &&
    !card.includes('text-critical') && !card.includes('bg-success'))
  check('supporting line present',
    card.includes('Based on your recent intake, weekly weigh-ins, and activity pattern.'))
  check('no energy arithmetic in JSX (presentation only)',
    // Model fields are rendered verbatim: no +,*,/ or spaced minus
    // touches a model expression, and no Math/toFixed exists.
    !/\{[^{}]*model\.\w+[^{}]*[+*][^{}]*\}/.test(card) &&
    !/\{[^{}]*model\.\w+[^{}]* - [^{}]*\}/.test(card) &&
    !card.includes('Math.') && !card.includes('.toFixed('))
  check('card is a server component consuming the finished model',
    !card.includes("'use client'") && card.includes('model: TodayEnergyBalanceViewModel'))
}

// ── 8. Dashboard wiring ──────────────────────────────────────────────
console.log('\n8. Dashboard wiring')
{
  check('widget id vocabulary gains energy (documented, deliberate)',
    widget.includes("| 'energy' // Phase 5B.3"))
  check('page mounts the widget with the energy id',
    page.includes('<TodayWidget id="energy">') &&
    page.includes('<EnergyBalanceCard model={energyBalance} />'))
  // RETARGET (UI-2): the original placement pins described the 5B.3
  // one-card lg:grid-cols-3 row — which the UI-0 audit identified as
  // THE desktop-whitespace defect and UI-2 was commissioned to fix.
  // The surviving 5B.3 boundaries: the energy widget is mounted with
  // its id + model (pinned above), keeps a medium footprint (never
  // page-dominating, stacked on mobile), and its evidence semantics
  // are untouched (pinned throughout this suite). Its region is now a
  // balanced half-width span that never leaves permanent empty
  // columns.
  // RETARGET (UI-3): the span comes from the preference size
  // contract — energy supports only half/full (its evidence must
  // never compress into a compact third), so the one-child defect
  // row is impossible by construction.
  check('energy region comes from the size contract (half/full only)',
    page.includes('<TodayWidget id="energy">') &&
    read('src/lib/dashboard-prefs.ts').includes("energy: ['half', 'full']") &&
    !page.includes('lg:grid-cols-3">'))
  check('medium footprint: default half on desktop, stacked on mobile',
    read('src/lib/dashboard-prefs.ts').includes("energy: 'half'") &&
    page.includes('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12'))
  check('fetch reuses already-fetched target/profile/logs (parallel with coach summary)',
    page.includes('fetchTodayEnergyBalance(') &&
    page.includes('supabase, user.id, today, nutritionTarget, profile, todayFoodLogs'))
  // RETARGET (UI-2): "untouched" was a historical claim that 5B.3
  // did not restructure the pre-existing grids — true at 5B.3 time.
  // UI-2 legitimately recomposed Today; the surviving boundary is
  // that every pre-5B.3 widget remains mounted alongside energy.
  check('pre-5B.3 widgets all still mounted alongside energy',
    ['"nutrition"', '"weight"', '"steps"', '"workout"', '"decisions"']
      .every((id) => page.includes(`<TodayWidget id=${id}`)))
  // RETARGET (UI-3): the fasting condition now gates through the
  // preference visibility pipeline (hide-only, never reveal) — the
  // 5B.3 boundary (the profile condition governs) is intact.
  check('fasting condition still governs the fasting widget',
    page.includes('visibleDashboardWidgets(prefs, profile.fasting_enabled)'))
  check('every legacy widget still mounted',
    ['"nutrition"', '"weight"', '"steps"', '"workout"', '"fasting"', '"decisions"']
      .every((id) => page.includes(`<TodayWidget id=${id}`)))
}

// ── 9. No-double-count / no-eat-back proof ───────────────────────────
console.log('\n9. No-double-count proof')
{
  check('fetch NEVER selects session calories (durations only, for the baseline)',
    lib.includes(".select('workout_date, completed_duration_seconds')") &&
    lib.includes(".select('activity_date, duration_seconds')") &&
    !stripComments(lib).includes('calories_burned'))
  check('no "calories burned today" anywhere',
    CHANGED.every((f) => !/calories burned|caloriesBurnedToday|burnedToday/i
      .test(stripComments(f))))
  check('no session-calorie sum, no earned calories, no eat-back',
    CHANGED.every((f) =>
      !/eat.?back|earned|remaining after exercise|\+ *workoutCalories|\+ *activityCalories/i
        .test(stripComments(f))))
  check('no steps/distance-to-calorie conversion',
    CHANGED.every((f) => !/stepsToCalories|caloriesFromSteps|distanceToCalories/i
      .test(stripComments(f))))
  check('consumed calories share the Nutrition-card computation (one source)',
    lib.includes("import { computeDailyTotals } from '@/lib/food'") &&
    lib.includes('computeDailyTotals(todayFoodLogs, todayStr).calories'))
  check('active target only — no historical target in the Today display',
    lib.includes('targetCalories: target?.calories ?? null'))
  check('no recommendation language in scope',
    CHANGED.every((f) =>
      !/reduce (your )?calories|increase (your )?calories|should eat|try \d/i
        .test(stripComments(f))))
}

// ── 10. Docs and hygiene ─────────────────────────────────────────────
console.log('\n10. Docs and hygiene')
{
  check('notes document the trajectory-vs-daily distinction',
    notes.includes('distinct') && notes.includes('trajectory'))
  check('notes document the maintenance-range gating',
    notes.includes('high') && notes.includes('settling'))
  check('notes document the no-eat-back principle',
    /eat.?back/i.test(notes))
  check('notes record no migration', /no migration/i.test(notes))
  check('notes record the hosted QA protocol',
    notes.includes('phase5b3-qa'))
  check('notes flag retargets', /retarget/i.test(notes))
  check('no legacy brand violations',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 11. Runtime: extended matrices ───────────────────────────────────
console.log('\n11. Runtime: extended matrices')
{
  // Calorie-state matrix vs a 2,100 target (10% band = 1,890..2,310).
  for (const [cal, expected] of [
    [1500, 'under'], [1880, 'under'], [1890, 'near'], [2100, 'near'],
    [2310, 'near'], [2320, 'over'], [2500, 'over'],
  ] as const) {
    check(`runtime: calorie matrix — ${cal} vs 2100 -> ${expected}`,
      vm({ todayCalories: cal }).calorieState === expected)
  }
  // Pass-through fidelity.
  for (const target of [1200, 1800, 2400, 3000]) {
    check(`runtime: target ${target} passes through verbatim`,
      vm({ targetCalories: target, todayCalories: target }).calorieTarget === target)
  }
  for (const cal of [900, 1850, 2750]) {
    check(`runtime: consumed ${cal} passes through verbatim`,
      vm({ todayCalories: cal }).caloriesConsumed === cal)
  }

  // Trajectory band-boundary matrix over synthetic trends.
  const trend = (ratePct: number, direction: 'losing' | 'holding' | 'gaining'): WeightTrendFact => ({
    anchorCount: 4,
    weeklyRateLb: ratePct * 1.9,
    weeklyRatePercent: ratePct,
    trendDirection: direction,
    trendConfidence: 'moderate',
    meanAbsResidualLb: 0.2,
  })
  // fat_loss, bf >= 20 (band 0.5..1.25 loss).
  for (const [rate, expected] of [
    [-0.4, 'watching'], [-0.5, 'on_track'], [-1.0, 'on_track'],
    [-1.25, 'on_track'], [-1.3, 'watching'],
  ] as const) {
    check(`runtime: fat_loss bf22 rate ${rate}%/wk -> ${expected}`,
      classifyTrajectory('fat_loss', 22, trend(rate, 'losing')).state === expected)
  }
  // fat_loss, bf < 10 (band 0.25..0.5).
  for (const [rate, expected] of [
    [-0.2, 'watching'], [-0.25, 'on_track'], [-0.5, 'on_track'], [-0.6, 'watching'],
  ] as const) {
    check(`runtime: fat_loss bf8 rate ${rate}%/wk -> ${expected}`,
      classifyTrajectory('fat_loss', 8, trend(rate, 'losing')).state === expected)
  }
  // fat_loss, unknown bf (default band 0.5..1.0).
  for (const [rate, expected] of [
    [-0.45, 'watching'], [-0.75, 'on_track'], [-1.1, 'watching'],
  ] as const) {
    check(`runtime: fat_loss default-band rate ${rate}%/wk -> ${expected}`,
      classifyTrajectory('fat_loss', null, trend(rate, 'losing')).state === expected)
  }
  // Body-fat band selection boundaries.
  check('runtime: bf exactly 20 uses the wide band',
    classifyTrajectory('fat_loss', 20, trend(-1.2, 'losing')).state === 'on_track')
  check('runtime: bf 19.9 uses the default band',
    classifyTrajectory('fat_loss', 19.9, trend(-1.2, 'losing')).state === 'watching')
  check('runtime: bf 9.99 uses the lean band',
    classifyTrajectory('fat_loss', 9.99, trend(-0.6, 'losing')).state === 'watching')
  // Gain band 0.1..0.5.
  for (const [rate, expected] of [
    [0.05, 'watching'], [0.1, 'on_track'], [0.5, 'on_track'], [0.6, 'watching'],
  ] as const) {
    check(`runtime: muscle_gain rate +${rate}%/wk -> ${expected}`,
      classifyTrajectory('muscle_gain', null, trend(rate, 'gaining')).state === expected)
  }
  // Maintenance by direction.
  check('runtime: maintenance holding -> on_track (direction-driven)',
    classifyTrajectory('maintenance', null, trend(0.02, 'holding')).state === 'on_track')
  check('runtime: maintenance losing -> watching',
    classifyTrajectory('maintenance', null, trend(-0.3, 'losing')).state === 'watching')
  check('runtime: maintenance gaining -> watching',
    classifyTrajectory('maintenance', null, trend(0.3, 'gaining')).state === 'watching')
  // Labels are the exact restrained vocabulary.
  check('runtime: label matrix',
    classifyTrajectory('fat_loss', 22, trend(-0.75, 'losing')).label === 'On track' &&
    classifyTrajectory('fat_loss', 22, trend(-0.1, 'losing')).label === 'Watching trend' &&
    classifyTrajectory('running', null, trend(0.3, 'gaining')).label === 'Trending up')

  // Maintenance gating tuple across all four statuses.
  for (const [status, expectRange, expectNote] of [
    ['insufficient_data', false, false], ['observing', false, false],
    ['moderate_confidence', false, true], ['high_confidence', true, false],
  ] as const) {
    const m = vm({ adaptive: { ...HIGH_ADAPTIVE, status } })
    check(`runtime: gating matrix — ${status} -> range:${expectRange} note:${expectNote}`,
      (m.maintenanceRange !== null) === expectRange &&
      (m.maintenanceNote !== null) === expectNote)
  }
  check('runtime: defensive — high status with a null range renders nothing',
    (() => {
      const m = vm({ adaptive: { ...HIGH_ADAPTIVE, status: 'high_confidence', estimatedMaintenanceRange: null } })
      return m.maintenanceRange === null
    })())

  // Confidence copy priority permutations.
  check('runtime: priority permutation A',
    confidenceMessageFor(['recent_target_change', 'insufficient_weight_anchors']) ===
      'Need another weekly weigh-in')
  check('runtime: priority permutation B',
    confidenceMessageFor(['recent_target_change', 'nutrition_logging_incomplete']) ===
      'Mark completed food-log days to improve your estimate')
  check('runtime: priority permutation C',
    confidenceMessageFor(['no_activity_baseline', 'recent_target_change']) ===
      'Targets changed recently — estimates are resettling')

  // View-model shape is the exact contract.
  check('runtime: view-model carries exactly the contract fields',
    Object.keys(vm()).sort().join(',') ===
      'activityContext,calorieState,calorieTarget,caloriesConsumed,confidenceLevel,confidenceMessage,maintenanceNote,maintenanceRange,trajectoryLabel,trajectoryState')
  check('runtime: trend_only label reaches the model verbatim',
    (() => {
      const m = vm({ goal: 'running' })
      return m.trajectoryState === 'trend_only' &&
        ['Trending down', 'Stable', 'Trending up'].includes(m.trajectoryLabel)
    })())
  check('runtime: builder never mutates its adaptive input',
    (() => {
      const before = JSON.stringify(HIGH_ADAPTIVE)
      vm()
      return JSON.stringify(HIGH_ADAPTIVE) === before
    })())

  // Card statics: exact row vocabulary.
  for (const label of ["low: 'Low'", "normal: 'Normal'", "high: 'High'"]) {
    check(`card: activity label ${label}`, card.includes(label))
  }
  check('card: Recent trend row present (distinct from Calories)',
    card.includes('>Recent trend</span>'))
  check('card: Confidence row present', card.includes('>Confidence</span>'))
  check('card: kcal/day unit on the range', card.includes('kcal/day'))

  // Lib statics: the seven bounded reads, individually pinned.
  for (const table of ['food_logs', 'nutrition_day_status', 'nutrition_targets',
    'body_metrics', 'daily_activity_logs', 'workout_sessions', 'activity_sessions']) {
    check(`lib: bounded read of ${table}`, lib.includes(`from('${table}')`))
  }
  check('lib: every read is window-bounded (no all-time scans)',
    (lib.match(/\.gte\(/g) || []).length >= 6 &&
    (lib.match(/\.lte\(/g) || []).length >= 7)
  check('lib: read failures degrade with observable errors',
    lib.includes('console.error(`fetchTodayEnergyBalance'))
  check('lib: pure module boundaries (no client directive, no storage)',
    !lib.includes("'use client'") && !lib.includes('localStorage'))
  check('lib: INFERENCE_WINDOW_DAYS drives the activity window',
    lib.includes('INFERENCE_WINDOW_DAYS - 1'))
  check('widget: id union documented with the phase marker',
    widget.includes("| 'energy' // Phase 5B.3: the Energy Balance widget"))
  check('page: single energy mount',
    (page.match(/<TodayWidget id="energy">/g) || []).length === 1)
  // Notes completeness loop.
  for (const item of ['computeDailyTotals', 'fatLossBand', 'Gauge', '375px']) {
    check(`notes mention ${item}`, notes.includes(item))
  }
  // Final contract details.
  for (const [cal, expected] of [[0, 'under'], [1, 'under'], [4200, 'over']] as const) {
    check(`runtime: calorie matrix extremes — ${cal} -> ${expected}`,
      vm({ todayCalories: cal }).calorieState === expected)
  }
  check('runtime: explicit-zero intake day is still a recorded value (not no_food)',
    vm({ todayCalories: 0 }).caloriesConsumed === 0)
  for (const level of ['low', 'moderate', 'high'] as const) {
    check(`runtime: confidence level '${level}' passes through`,
      vm({ energyConfidence: { level, reasons: [] } }).confidenceLevel === level)
  }
  check('runtime: strength goal shares the gain band',
    classifyTrajectory('strength', null, {
      anchorCount: 4, weeklyRateLb: 0.6, weeklyRatePercent: 0.3,
      trendDirection: 'gaining', trendConfidence: 'moderate', meanAbsResidualLb: 0.2,
    }).state === 'on_track')
  check('runtime: unknown context + confidence message coexist cleanly',
    (() => {
      const m = vm({
        activityContext: 'unknown',
        energyConfidence: { level: 'moderate', reasons: ['no_activity_baseline'] },
      })
      return m.activityContext === 'unknown' &&
        m.confidenceMessage === 'Log steps or activity to build your baseline'
    })())
  check('lib: target history read is bounded to 12 versions',
    lib.includes('.limit(12)'))
  check('lib: explicit dates come from nutrition_day_status rows',
    lib.includes('explicitDates = new Set<string>('))
  check('lib: anchors derive through the 5B.1 helper',
    lib.includes('deriveWeeklyWeightAnchors(weighRes.data ?? [], todayStr)'))
  check('lib: baseline weight prefers the latest weigh-in',
    lib.includes('latestWeighKg') && lib.includes('kgToLbs(latestWeighKg)'))
  check('lib: profile weight is the fallback, never a guess',
    lib.includes('profile.current_weight_kg !== null ? kgToLbs(profile.current_weight_kg) : null'))
  check('lib: adaptive inference + energy confidence wired through the real layers',
    lib.includes('inferAdaptiveMaintenance({ baseline, weeks, daysSinceTargetChange })') &&
    lib.includes('computeEnergyConfidence({'))
  check('page: energyBalance resolved in the parallel batch',
    page.includes('const [nutritionCoachSummary, energyBalance] = await Promise.all(['))
  check('card: the no_food branch renders copy, never numbers',
    (() => {
      const branch = card.slice(card.indexOf("'no_food' ? ("), card.indexOf(') : (', card.indexOf("'no_food' ? (")))
      return !branch.includes('toLocaleString')
    })())

}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
