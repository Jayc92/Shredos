// ============================================================
// ForgeFitOS — Phase 5B.2 deterministic verification harness
// Verifies explicit nutrition-day completion (migration 019 +
// /api/nutrition/day-status + the Food Log toggle) and adaptive
// maintenance inference: historical target resolution, the
// explicit>heuristic>partial>missing hierarchy, qualifying weeks,
// the maintenance math (sign-pinned, 3500 approximation), bounded
// adaptation (100/week + 25% clamp, derived not persisted), outlier
// exclusion with reason codes, and the absolute boundaries: no
// recommendations, no 3E changes, no Today widget, no session
// calories in the inference, migrations exactly 001-019.
// All math executes at RUNTIME against the real libs.
// Run from the repository root:
//   npx tsx scripts/verify-phase5b2.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  buildDailyNutritionFacts,
  buildDailyNutritionFactsWithContext,
  resolveTargetForDate,
  deriveWeeklyWeightAnchors,
  computeWeightTrend,
  resolveDailyExpenditure,
} from '../src/lib/energy-facts'
import type { DailyNutritionFact, WeeklyWeightAnchor } from '../src/lib/energy-facts'
import {
  estimateBaselineTdee,
  buildQualifyingWeeks,
  inferAdaptiveMaintenance,
  INFERENCE_WINDOW_DAYS,
  MAX_INFERENCE_WEEKS,
  MIN_QUALIFYING_WEEKS,
  MIN_COMPLETE_DAYS_PER_WEEK,
  KCAL_PER_LB,
  ADAPTIVE_STEP_PER_WEEK_KCAL,
  ADAPTIVE_CLAMP_FRACTION,
  OUTLIER_WEEKLY_CHANGE_PCT,
  IMPLAUSIBLE_INTAKE_FLOOR,
  MAINTENANCE_RANGE_ROUNDING,
} from '../src/lib/energy-model'
import type { QualifyingEnergyWeek } from '../src/lib/energy-model'

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
const stripSql = (s: string) => s.replace(/^--.*$/gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const migration = read('supabase/migrations/019_phase5b2_nutrition_day_status.sql')
const types = read('src/types/database.ts')
const route = read('src/app/api/nutrition/day-status/route.ts')
const factsLib = read('src/lib/energy-facts.ts')
const modelLib = read('src/lib/energy-model.ts')
const toggle = read('src/components/food/DayCompleteToggle.tsx')
const foodPage = read('src/app/(app)/food/page.tsx')
const notes = read('docs/phase5b2-adaptive-maintenance-notes.md')

const CHANGED = [types, route, factsLib, modelLib, toggle, foodPage]

// ── Fixture builders ─────────────────────────────────────────────────
// Window: the four ISO weeks ending 2026-08-09 (a Sunday), Mondays:
const MONDAYS = ['2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03']
const WINDOW_START = '2026-07-13'
const WINDOW_END = '2026-08-09'
const dayOf = (monday: string, offset: number) => {
  const d = new Date(`${monday}T12:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const food = (date: string, calories: number, protein = 30, carbs = 40, fat = 15) => ({
  logged_date: date, calories, protein_g: protein, carbs_g: carbs, fat_g: fat,
})
/** Five two-entry days per week at a given daily total. */
function weekRows(monday: string, dailyCal: number, days = 5) {
  const rows = []
  for (let i = 0; i < days; i++) {
    const date = dayOf(monday, i)
    rows.push(food(date, Math.round(dailyCal * 0.6)))
    rows.push(food(date, dailyCal - Math.round(dailyCal * 0.6)))
  }
  return rows
}
function weekDates(monday: string, days = 5) {
  return Array.from({ length: days }, (_, i) => dayOf(monday, i))
}
const anchor = (weekStart: string, lbs: number, quality: 'single' | 'multi' = 'single'): WeeklyWeightAnchor => ({
  weekStart, anchorLbs: lbs, contributingDates: quality === 'multi' ? 2 : 1, quality,
})
const TARGETS_2000 = [{ effective_date: '2026-06-01', calories: 2000 }]
const BASELINE_190 = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'moderately_active' })

/** A full standard fixture: N weeks of explicit 5-day logging at a
 *  per-week calorie level + weekly anchors. */
function standardWeeks(input: {
  calsByWeek: number[]
  anchorsByWeek: Array<number | null>
  explicit?: boolean
}): QualifyingEnergyWeek[] {
  const rows = MONDAYS.flatMap((m, i) =>
    input.calsByWeek[i] !== undefined ? weekRows(m, input.calsByWeek[i]) : [])
  const explicitDates = new Set(
    input.explicit === false ? [] : MONDAYS.flatMap((m, i) =>
      input.calsByWeek[i] !== undefined ? weekDates(m) : [])
  )
  const facts = buildDailyNutritionFactsWithContext(rows, WINDOW_START, WINDOW_END, {
    targetHistory: TARGETS_2000,
    explicitCompleteDates: explicitDates,
  })
  const anchors = MONDAYS
    .map((m, i) => input.anchorsByWeek[i] !== null && input.anchorsByWeek[i] !== undefined
      ? anchor(m, input.anchorsByWeek[i] as number) : null)
    .filter((a): a is WeeklyWeightAnchor => a !== null)
  return buildQualifyingWeeks({ nutritionFacts: facts, anchors, endDate: WINDOW_END })
}

// ── 1. Checkpoint and migration 019 ──────────────────────────────────
console.log('\n1. Checkpoint and migration 019')
{
  check('checkpoint artifacts exist (99534fb tree)',
    ['scripts/verify-phase5b1.ts', 'docs/phase5b1-energy-foundation-notes.md',
      'src/lib/energy-facts.ts', 'src/lib/coach-signals.ts']
      .every((f) => existsSync(f)))
  check('5B.2 notes exist', notes.length > 3000)
  // RETARGET (UI-3): 020 is the approved dashboard-prefs migration;
  // the surviving 5B.2 boundary is that 019 exists and remains the
  // 5B.2 addition (the total-count clause moved with the roadmap).
  check('migration boundary: 019 present; 020 is the approved UI-3 file',
    existsSync('supabase/migrations/019_phase5b2_nutrition_day_status.sql') &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('020')).length === 1 &&
    readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
  check('019 creates nutrition_day_status', migration.includes('CREATE TABLE nutrition_day_status ('))
  const COLUMNS = [
    'id           UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'user_id      UUID NOT NULL',
    'logged_date  DATE NOT NULL',
    'status       TEXT NOT NULL',
    'created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    'updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  ]
  for (const col of COLUMNS) {
    check(`column: ${col.split(/\s+/)[0]}`, migration.includes(col))
  }
  check('status CHECK allows ONLY complete',
    migration.includes("CHECK (status IN ('complete'))") &&
    !stripSql(migration).includes("'partial'") &&
    !stripSql(migration).includes("'incomplete'") &&
    !stripSql(migration).includes("'skipped'") &&
    !stripSql(migration).includes("'estimated'"))
  check('unique user+date', migration.includes('UNIQUE (user_id, logged_date)'))
  check('user FK cascades', /user_id[\s\S]{0,120}auth\.users\(id\)[\s\S]{0,40}ON DELETE CASCADE/.test(migration))
  check('reuses the standing updated_at trigger helper',
    migration.includes('EXECUTE FUNCTION update_updated_at_column()'))
  check('RLS enabled', migration.includes('ALTER TABLE nutrition_day_status ENABLE ROW LEVEL SECURITY;'))
  check('exactly four own-row policies',
    (migration.match(/CREATE POLICY nutrition_day_status_/g) || []).length === 4 &&
    (migration.match(/user_id = auth\.uid\(\)/g) || []).length === 5)
  check('authenticated CRUD grant (the 015/016 lesson)',
    migration.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_day_status TO authenticated;'))
  check('no anon grant; no service role',
    !stripSql(migration).includes('anon') && !stripSql(migration).includes('service_role'))
  check('019 notifies PostgREST', migration.includes("NOTIFY pgrst, 'reload schema';"))
  check('absence-means-unknown documented in-migration',
    migration.includes('never') && migration.includes('incomplete'))
  check('NO adaptive-state tables anywhere (derived, not persisted)',
    !stripSql(migration).includes('adaptive_tdee_state') &&
    !readdirSync('supabase/migrations').some((f) =>
      f.includes('adaptive') || f.includes('energy_balance') || f.includes('energy_facts')) &&
    CHANGED.every((f) => !stripComments(f).includes("from('adaptive_tdee_state')")))
  check('types define NutritionDayStatus exactly',
    types.includes('export interface NutritionDayStatus') &&
    types.includes("status: 'complete'"))
  check('019 contains no emoji/pictographs', !EMOJI.test(migration))
}

// ── 2. Day-status API ────────────────────────────────────────────────
console.log('\n2. Day-status API')
{
  check('auth required on every method',
    (route.match(/\{ error: 'Unauthorized' \}, \{ status: 401 \}/g) || []).length === 3)
  check('date validated against the local-date pattern everywhere',
    (route.match(/DATE_PATTERN/g) || []).length >= 4)
  // RETARGET (LOCAL-DATE-FIX): original boundary — the future guard
  // compared against `todayISO()` (server UTC day), which rejected
  // valid same-day writes after 8pm ET. The guard itself is intact;
  // "today" is now the cookie-resolved user-local day.
  check('future dates rejected on write (user-local today, /api/activity convention)',
    route.includes('raw > localTodayFromCookies()') &&
    route.includes("Enter a valid date that isn't in the future."))
  check('PUT is an idempotent own-row upsert',
    route.includes(".upsert(") &&
    route.includes("{ onConflict: 'user_id,logged_date' }") &&
    route.includes("status: 'complete',"))
  check('user_id comes from the session, never the client',
    route.includes('user_id: user.id,') &&
    !route.includes('body.user_id') && !route.includes('body.userId'))
  check('DELETE constrained to own row',
    /\.delete\(\)[\s\S]{0,80}\.eq\('user_id', user\.id\)[\s\S]{0,60}\.eq\('logged_date', raw\)/.test(route))
  check('GET absence semantics: complete false = unknown (documented)',
    route.includes('complete: data !== null') &&
    stripComments(route).length > 0 && route.includes('never'))
  check('edit-after-complete does NOT auto-clear (documented; no food_logs coupling)',
    route.includes('does NOT clear') &&
    !stripComments(route).includes('food_logs'))
  check('route contains no emoji', !EMOJI.test(route))
}

// ── 3. Food Log UI ───────────────────────────────────────────────────
console.log('\n3. Food Log UI')
{
  check('toggle is a client component using existing primitives',
    toggle.includes("'use client'") && toggle.includes('Card variant="subtle"'))
  check('professional iconography, no emoji',
    toggle.includes("import { CheckCircle2 } from 'lucide-react'") && !EMOJI.test(toggle))
  check('incomplete state: Mark day complete',
    toggle.includes("'Mark day complete'"))
  check('complete state: confirmation + Undo',
    toggle.includes('Day marked complete') && toggle.includes("'Undo'"))
  check('undo needs no destructive confirmation',
    !toggle.includes('confirm('))
  check('writes through the day-status endpoint only',
    toggle.includes("fetch('/api/nutrition/day-status'") &&
    toggle.includes("fetch(`/api/nutrition/day-status?date=${date}`"))
  check('refreshes server state after both actions',
    (toggle.match(/router\.refresh\(\)/g) || []).length === 2)
  check('page fetches the SELECTED date status server-side',
    foodPage.includes(".from('nutrition_day_status')") &&
    foodPage.includes(".eq('logged_date', date)"))
  check('mounted per-date (5A.3 date-isolation lesson) and hidden on future dates',
    foodPage.includes('{date <= todayStr && (') &&
    foodPage.includes('<DayCompleteToggle key={date} date={date} initialComplete={dayStatusRes.data !== null} />'))
  check('affordance placed as restrained end-of-flow (after meals, before secondary tools)',
    foodPage.indexOf('MEAL_TYPES.map') < foodPage.indexOf('DayCompleteToggle key=') &&
    foodPage.indexOf('DayCompleteToggle key=') < foodPage.indexOf('<QuickDrinkLog'))
  check('existing food page flows untouched (meals/quick add/drinks/label calc)',
    foodPage.includes('<QuickAddPanel savedMeals={savedMeals} date={date} />') &&
    foodPage.includes('<LabelCalculatorForm date={date} />'))
}

// ── 4. Runtime: historical target resolution ─────────────────────────
console.log('\n4. Runtime: historical target resolution')
{
  const history = [
    { effective_date: '2026-07-01', calories: 2200 },
    { effective_date: '2026-08-01', calories: 2000 },
  ]
  check('runtime: date before any version -> null (never guessed)',
    resolveTargetForDate(history, '2026-06-15') === null)
  check('runtime: date in the first era -> old target',
    resolveTargetForDate(history, '2026-07-20')!.calories === 2200)
  check('runtime: effective date itself uses the new version',
    resolveTargetForDate(history, '2026-08-01')!.calories === 2000)
  check('runtime: date after the change -> new target',
    resolveTargetForDate(history, '2026-08-09')!.calories === 2000)
  check('runtime: unordered history still resolves the latest applicable',
    resolveTargetForDate([history[1], history[0]], '2026-07-20')!.calories === 2200)
  const facts = buildDailyNutritionFactsWithContext(
    [...weekRows('2026-07-27', 2100, 7), ...weekRows('2026-08-03', 2100, 7)],
    '2026-07-27', '2026-08-09',
    { targetHistory: history, explicitCompleteDates: new Set() })
  check('runtime: facts BEFORE the change carry the old target',
    facts.find((f) => f.date === '2026-07-30')!.targetCalories === 2200)
  check('runtime: facts AFTER the change carry the new target',
    facts.find((f) => f.date === '2026-08-05')!.targetCalories === 2000)
  check('runtime: no retroactive today-target bleed (same intake, different adherence era)',
    (() => {
      const before = facts.find((f) => f.date === '2026-07-30')!
      const after = facts.find((f) => f.date === '2026-08-05')!
      // 2,100 kcal vs 2,200 is near; vs 2,000 is near too (5%) — use
      // targets far enough apart to split classification:
      const split = buildDailyNutritionFactsWithContext(
        [...weekRows('2026-07-27', 2500, 7), ...weekRows('2026-08-03', 2500, 7)],
        '2026-07-27', '2026-08-09',
        { targetHistory: [
          { effective_date: '2026-07-01', calories: 2500 },
          { effective_date: '2026-08-01', calories: 2000 },
        ], explicitCompleteDates: new Set() })
      return before.targetCalories === 2200 && after.targetCalories === 2000 &&
        split.find((f) => f.date === '2026-07-30')!.adherence === 'near' &&
        split.find((f) => f.date === '2026-08-05')!.adherence === 'over'
    })())
  check('runtime: day with no historical target has null target and null adherence',
    (() => {
      const f = buildDailyNutritionFactsWithContext(
        weekRows('2026-06-15', 2000, 1), '2026-06-15', '2026-06-15',
        { targetHistory: history, explicitCompleteDates: new Set() })[0]
      return f.targetCalories === null && f.adherence === null &&
        f.calories === 2000
    })())
  check('runtime: 5B.1 flat-target builder still works unchanged',
    (() => {
      const f = buildDailyNutritionFacts(
        weekRows('2026-08-03', 1950, 1), '2026-08-03', '2026-08-03', 2000)[0]
      return f.completeness === 'likely_complete' && f.adherence === 'near' &&
        f.explicitComplete === false
    })())
}

// ── 5. Runtime: explicit-vs-heuristic hierarchy ──────────────────────
console.log('\n5. Runtime: completeness hierarchy')
{
  const rows = weekRows('2026-08-03', 1900, 3)
  const ctx = (explicit: string[]) => buildDailyNutritionFactsWithContext(
    rows, '2026-08-03', '2026-08-09',
    { targetHistory: TARGETS_2000, explicitCompleteDates: new Set(explicit) })
  check('runtime: explicit mark upgrades a logged day to explicit_complete',
    (() => {
      const f = ctx([dayOf('2026-08-03', 0)])[0]
      return f.completeness === 'explicit_complete' && f.explicitComplete === true
    })())
  check('runtime: unmarked logged day stays heuristic likely_complete',
    ctx([])[0].completeness === 'likely_complete')
  check('runtime: explicit beats heuristic even on a low-calorie day the heuristic calls partial',
    (() => {
      const lowRows = [food('2026-08-04', 400), food('2026-08-04', 250)]
      const f = buildDailyNutritionFactsWithContext(
        lowRows, '2026-08-04', '2026-08-04',
        { targetHistory: TARGETS_2000, explicitCompleteDates: new Set(['2026-08-04']) })[0]
      return f.completeness === 'explicit_complete' && f.calories === 650
    })())
  check('runtime: explicit mark on a day with NO intake stays missing (no fabricated calories)',
    (() => {
      const f = buildDailyNutritionFactsWithContext(
        [], '2026-08-05', '2026-08-05',
        { targetHistory: TARGETS_2000, explicitCompleteDates: new Set(['2026-08-05']) })[0]
      return f.completeness === 'missing' && f.explicitComplete === true &&
        f.calories === null
    })())
  check('runtime: adherence classified on explicit days too',
    (() => {
      const f = buildDailyNutritionFactsWithContext(
        [food('2026-08-04', 1500), food('2026-08-04', 450)],
        '2026-08-04', '2026-08-04',
        { targetHistory: TARGETS_2000, explicitCompleteDates: new Set(['2026-08-04']) })[0]
      return f.completeness === 'explicit_complete' && f.adherence === 'near'
    })())
  check('runtime: edit after complete recomputes intake (pure — no snapshot)',
    (() => {
      const before = buildDailyNutritionFactsWithContext(
        [food('2026-08-04', 1500), food('2026-08-04', 450)],
        '2026-08-04', '2026-08-04',
        { targetHistory: TARGETS_2000, explicitCompleteDates: new Set(['2026-08-04']) })[0]
      const after = buildDailyNutritionFactsWithContext(
        [food('2026-08-04', 1500), food('2026-08-04', 450), food('2026-08-04', 600)],
        '2026-08-04', '2026-08-04',
        { targetHistory: TARGETS_2000, explicitCompleteDates: new Set(['2026-08-04']) })[0]
      return before.calories === 1950 && after.calories === 2550 &&
        before.explicitComplete && after.explicitComplete
    })())
  check('runtime: missing days never become zero calories',
    (() => {
      const f = buildDailyNutritionFactsWithContext(
        [], '2026-08-06', '2026-08-07',
        { targetHistory: TARGETS_2000, explicitCompleteDates: new Set() })
      return f.every((d) => d.calories === null && d.completeness === 'missing')
    })())
}

// ── 6. Runtime: qualifying weeks ─────────────────────────────────────
console.log('\n6. Runtime: qualifying weeks')
{
  const weeks = standardWeeks({
    calsByWeek: [2000, 2000, 2000, 2000],
    anchorsByWeek: [190, 189, 188, 187],
  })
  check('runtime: window partitions into exactly MAX_INFERENCE_WEEKS ISO weeks',
    weeks.length === 4 && MAX_INFERENCE_WEEKS === 4 && INFERENCE_WINDOW_DAYS === 28)
  check('runtime: week boundaries are Monday..Sunday',
    weeks[0].weekStart === '2026-07-13' && weeks[0].weekEnd === '2026-07-19' &&
    weeks[3].weekStart === '2026-08-03' && weeks[3].weekEnd === '2026-08-09')
  check('runtime: five explicit days -> explicit evidence quality',
    weeks.every((w) => w.evidenceQuality === 'explicit' && w.explicitCompleteDays === 5))
  check('runtime: fully-evidenced weeks qualify with no exclusions',
    weeks.every((w) => w.qualifies && !w.excluded && w.exclusionReasons.length === 0))
  check('runtime: week intake mean is exact',
    weeks.every((w) => w.avgCalories === 2000))
  check('runtime: anchors attach to their weeks',
    weeks[0].weightAnchor!.anchorLbs === 190 && weeks[3].weightAnchor!.anchorLbs === 187)
  check('runtime: heuristic fallback (unmarked weeks) reads heuristic quality',
    (() => {
      const w = standardWeeks({
        calsByWeek: [2000, 2000, 2000, 2000],
        anchorsByWeek: [190, 189, 188, 187],
        explicit: false,
      })
      return w.every((x) => x.evidenceQuality === 'heuristic' &&
        x.heuristicCompleteDays === 5 && x.qualifies)
    })())
  check('runtime: a 1-2 confirmed-day week NEVER qualifies',
    (() => {
      const rows = [...weekRows('2026-07-13', 2000, 2), ...weekRows('2026-07-20', 2000, 5),
        ...weekRows('2026-07-27', 2000, 5), ...weekRows('2026-08-03', 2000, 5)]
      const facts = buildDailyNutritionFactsWithContext(rows, WINDOW_START, WINDOW_END, {
        targetHistory: TARGETS_2000,
        explicitCompleteDates: new Set([
          ...weekDates('2026-07-13', 2), ...weekDates('2026-07-20'),
          ...weekDates('2026-07-27'), ...weekDates('2026-08-03'),
        ]),
      })
      const weeks2 = buildQualifyingWeeks({
        nutritionFacts: facts,
        anchors: MONDAYS.map((m, i) => anchor(m, 190 - i)),
        endDate: WINDOW_END,
      })
      return !weeks2[0].qualifies &&
        weeks2[0].exclusionReasons.includes('insufficient_nutrition_days') &&
        weeks2.slice(1).every((w) => w.qualifies)
    })())
  check('runtime: MIN_COMPLETE_DAYS_PER_WEEK is 5', MIN_COMPLETE_DAYS_PER_WEEK === 5)
  check('runtime: missing anchor -> no_weight_anchor exclusion',
    (() => {
      const w = standardWeeks({
        calsByWeek: [2000, 2000, 2000, 2000],
        anchorsByWeek: [190, null, 188, 187],
      })
      return w[1].excluded && w[1].exclusionReasons.includes('no_weight_anchor') &&
        w[0].qualifies && w[2].qualifies && w[3].qualifies
    })())
  check('runtime: implausibly low intake week excluded (explicit low logging cannot masquerade)',
    (() => {
      const w = standardWeeks({
        calsByWeek: [600, 2000, 2000, 2000],
        anchorsByWeek: [190, 189, 188, 187],
      })
      return w[0].excluded && w[0].exclusionReasons.includes('implausible_low_intake') &&
        IMPLAUSIBLE_INTAKE_FLOOR === 800
    })())
  check('runtime: extreme weight week excluded; surrounding weeks retained',
    (() => {
      const w = standardWeeks({
        calsByWeek: [2000, 2000, 2000, 2000],
        anchorsByWeek: [190, 189.5, 185, 188.6],
      })
      // 189.5 -> 185 is a 2.37% one-week move (> 1.5%).
      return w[2].excluded && w[2].exclusionReasons.includes('extreme_weight_change') &&
        w[0].qualifies && w[1].qualifies &&
        OUTLIER_WEEKLY_CHANGE_PCT === 1.5
    })())
  check('runtime: target change inside the window is visible per week',
    (() => {
      const rows = MONDAYS.flatMap((m) => weekRows(m, 2000, 7))
      const facts = buildDailyNutritionFactsWithContext(rows, WINDOW_START, WINDOW_END, {
        targetHistory: [
          { effective_date: '2026-06-01', calories: 2200 },
          { effective_date: '2026-07-29', calories: 2000 },
        ],
        explicitCompleteDates: new Set(MONDAYS.flatMap((m) => weekDates(m, 7))),
      })
      const w = buildQualifyingWeeks({
        nutritionFacts: facts,
        anchors: MONDAYS.map((m, i) => anchor(m, 190 - i)),
        endDate: WINDOW_END,
      })
      // Week of 07-27 spans the 07-29 change -> sees both targets.
      return w[2].targetCaloriesSeen.length === 2 &&
        w[0].targetCaloriesSeen.length === 1 && w[3].targetCaloriesSeen.length === 1
    })())
  check('runtime: builder is pure and repeatable',
    (() => {
      const a = standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 189, 188, 187] })
      const b = standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 189, 188, 187] })
      return JSON.stringify(a) === JSON.stringify(b)
    })())
}

// ── 7. Runtime: maintenance math (sign-pinned) ───────────────────────
console.log('\n7. Runtime: maintenance math')
{
  const infer = (calsByWeek: number[], anchorsByWeek: number[], explicit = true) =>
    inferAdaptiveMaintenance({
      baseline: BASELINE_190,
      weeks: standardWeeks({ calsByWeek, anchorsByWeek, explicit }),
      daysSinceTargetChange: null,
    })
  check('runtime: THE CANONICAL EXAMPLE — 2,000 intake at -1 lb/wk infers 2,500 observed',
    (() => {
      const e = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return e.observedMaintenance === 2500 && e.weeklyRateLb === -1 &&
        e.avgQualifiedIntake === 2000
    })())
  check('runtime: KCAL_PER_LB is the documented 3500 approximation',
    KCAL_PER_LB === 3500 && modelLib.includes('APPROXIMATION'))
  check('runtime: flat weight -> observed equals intake',
    (() => {
      const e = infer([2000, 2000, 2000, 2000], [190, 190, 190, 190])
      return e.observedMaintenance === 2000 && e.weeklyRateLb === 0
    })())
  check('runtime: GAINING 1 lb/wk -> maintenance BELOW intake (sign pinned)',
    (() => {
      const e = infer([2500, 2500, 2500, 2500], [187, 188, 189, 190])
      return e.observedMaintenance === 2000 && e.weeklyRateLb === 1
    })())
  check('runtime: losing faster -> observed higher (monotone in rate)',
    (() => {
      const slow = infer([2000, 2000, 2000, 2000], [190, 189.5, 189, 188.5])
      const fast = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return (slow.observedMaintenance as number) < (fast.observedMaintenance as number)
    })())
  check('runtime: weight rate comes from the 5B.1 regression over qualifying anchors',
    (() => {
      const e = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      const direct = computeWeightTrend(MONDAYS.map((m, i) => anchor(m, 190 - i)))
      return e.weeklyRateLb === direct.weeklyRateLb && e.weightTrend.anchorCount === 4
    })())
  check('runtime: Friday-only cadence carries the whole inference (all single-quality anchors)',
    (() => {
      const e = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return e.status !== 'insufficient_data' && e.evidence.anchorsUsed === 4
    })())
}

// ── 8. Runtime: bounded adaptation ───────────────────────────────────
console.log('\n8. Runtime: bounded adaptation')
{
  const infer = (calsByWeek: number[], anchorsByWeek: Array<number | null>, baseline = BASELINE_190) =>
    inferAdaptiveMaintenance({
      baseline,
      weeks: standardWeeks({ calsByWeek, anchorsByWeek }),
      daysSinceTargetChange: null,
    })
  check('runtime: observation near baseline applies in full (within evidence bound)',
    (() => {
      // observed 2500, baseline 2280 -> raw +220 <= 4x100 evidence bound.
      const e = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return e.adaptiveCentral === 2500
    })())
  check('runtime: FAR-BELOW observation moves at most 100/week (600 disagreement != 600 move)',
    (() => {
      // Flat weight at 1500 intake -> observed 1500, raw -780; 4
      // qualifying weeks bound movement to 400.
      const e = infer([1500, 1500, 1500, 1500], [190, 190, 190, 190])
      return e.observedMaintenance === 1500 &&
        e.adaptiveCentral === BASELINE_190.primaryEstimate - 400 &&
        ADAPTIVE_STEP_PER_WEEK_KCAL === 100
    })())
  check('runtime: FAR-ABOVE observation equally bounded upward',
    (() => {
      // 2,600 intake while LOSING 1/wk -> observed 3,100; raw +820 -> +400.
      const e = infer([2600, 2600, 2600, 2600], [190, 189, 188, 187])
      return e.observedMaintenance === 3100 &&
        e.adaptiveCentral === BASELINE_190.primaryEstimate + 400
    })())
  check('runtime: fewer qualifying weeks -> smaller allowed movement',
    (() => {
      // Only 3 anchored weeks -> evidence bound 300.
      const e = infer([1500, 1500, 1500, 1500], [null, 190, 190, 190])
      return e.evidence.weeksQualified === 3 &&
        e.adaptiveCentral === BASELINE_190.primaryEstimate - 300
    })())
  check('runtime: 25% clamp binds before the evidence bound on small baselines',
    (() => {
      const smallBaseline = estimateBaselineTdee({ weightLbs: 100, activityLevel: 'sedentary' })
      const e = inferAdaptiveMaintenance({
        baseline: smallBaseline,
        weeks: standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 190, 190, 190] }),
        daysSinceTargetChange: null,
      })
      // baseline 1000; raw +1000; bounds: evidence 400, clamp 250.
      return e.adaptiveCentral === 1250 && ADAPTIVE_CLAMP_FRACTION === 0.25
    })())
  check('runtime: range bounds round to 50 and match the canonical example [2400, 2600]',
    (() => {
      const e = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return e.estimatedMaintenanceRange !== null &&
        e.estimatedMaintenanceRange[0] === 2400 &&
        e.estimatedMaintenanceRange[1] === 2600 &&
        MAINTENANCE_RANGE_ROUNDING === 50
    })())
  check('runtime: adaptation is pure — same inputs, same estimate (no hidden state)',
    (() => {
      const a = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      const b = infer([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return JSON.stringify(a) === JSON.stringify(b)
    })())
  check('static: no persisted adaptive state anywhere',
    !stripComments(modelLib).includes('adaptive_tdee_state') &&
    !modelLib.includes('localStorage') && !modelLib.includes('writeFile'))
}

// ── 9. Runtime: status ladder and confidence ─────────────────────────
console.log('\n9. Runtime: status and confidence')
{
  const infer = (opts: {
    cals?: number[]
    anchors?: Array<number | null>
    explicit?: boolean
    daysSinceTargetChange?: number | null
  }) => inferAdaptiveMaintenance({
    baseline: BASELINE_190,
    weeks: standardWeeks({
      calsByWeek: opts.cals ?? [2000, 2000, 2000, 2000],
      anchorsByWeek: opts.anchors ?? [190, 189, 188, 187],
      explicit: opts.explicit,
    }),
    daysSinceTargetChange: opts.daysSinceTargetChange ?? null,
  })
  check('runtime: 2 qualifying weeks -> insufficient_data with NO estimate at all',
    (() => {
      const e = infer({ anchors: [null, null, 188, 187] })
      return e.status === 'insufficient_data' && e.observedMaintenance === null &&
        e.adaptiveCentral === null && e.estimatedMaintenanceRange === null &&
        e.confidence.reasons.includes('insufficient_qualifying_weeks') &&
        MIN_QUALIFYING_WEEKS === 3
    })())
  check('runtime: 3 qualifying weeks -> observing (range widens to 200 half-width)',
    (() => {
      const e = infer({ anchors: [null, 190, 189, 188] })
      return e.status === 'observing' && e.estimatedMaintenanceRange !== null &&
        e.estimatedMaintenanceRange[1] - e.estimatedMaintenanceRange[0] === 400
    })())
  check('runtime: 4 explicit weeks, solid trend -> high_confidence',
    infer({}).status === 'high_confidence')
  check('runtime: heuristic-heavy evidence caps at moderate_confidence',
    (() => {
      const e = infer({ explicit: false })
      return e.status === 'moderate_confidence' &&
        e.confidence.reasons.includes('mostly_heuristic_nutrition_days') &&
        e.confidence.reasons.includes('insufficient_explicit_nutrition_days')
    })())
  check('runtime: recent target change caps at moderate_confidence',
    (() => {
      const e = infer({ daysSinceTargetChange: 5 })
      return e.status === 'moderate_confidence' &&
        e.confidence.reasons.includes('recent_target_change')
    })())
  check('runtime: noisy weight trend caps at moderate_confidence',
    (() => {
      const e = infer({ anchors: [190, 186.5, 189.5, 187] })
      // Big swings: some weeks excluded as outliers OR variance reads
      // high — either path prevents high confidence.
      return e.status !== 'high_confidence'
    })())
  check('runtime: outlier exclusion surfaces as a reason code',
    (() => {
      const e = infer({ anchors: [190, 189.5, 185, 188.6] })
      return e.confidence.reasons.includes('outlier_week_excluded')
    })())
  check('runtime: confidence level mirrors status',
    infer({}).confidence.level === 'high' &&
    infer({ explicit: false }).confidence.level === 'moderate' &&
    infer({ anchors: [null, 190, 189, 188] }).confidence.level === 'low')
  check('runtime: evidence counts reported for the AI layer',
    (() => {
      const e = infer({})
      return e.evidence.explicitDays === 20 && e.evidence.heuristicDays === 0 &&
        e.evidence.weeksQualified === 4 && e.evidence.anchorsUsed === 4
    })())
}

// ── 10. No double-counting (aggregate/component intact) ──────────────
console.log('\n10. No double-counting')
{
  check('static: inference consumes NO session calories/steps/distance',
    (() => {
      const section = modelLib.slice(modelLib.indexOf('Phase 5B.2'))
      const code = stripComments(section)
      return !code.includes('workoutCalories') && !code.includes('activityCalories') &&
        !code.includes('calories_burned') && !code.includes('steps') &&
        !code.includes('distance_meters')
    })())
  check('static: inference input shape is nutrition facts + anchors only',
    modelLib.includes('nutritionFacts: DailyNutritionFact[]') &&
    modelLib.includes('anchors: WeeklyWeightAnchor[]'))
  check('runtime: the 850/520/180 aggregate/component boundary is unchanged',
    (() => {
      const e = resolveDailyExpenditure(
        { calories: 850, source: 'apple_health' },
        { workoutCalories: 520, activityCalories: 180 })
      return e.authoritativeCalories === 850
    })())
  check('static: no steps/distance-to-calorie conversion anywhere in scope',
    CHANGED.every((f) => !/stepsToCalories|caloriesFromSteps|distanceToCalories/i
      .test(stripComments(f))))
  check('no eat-back anywhere in scope',
    CHANGED.every((f) => !/eat.?back|calorie credit|earned food/i.test(stripComments(f))))
}

// ── 11. Boundary ─────────────────────────────────────────────────────
console.log('\n11. Boundary')
{
  // RETARGETED (5B.3): the Energy Balance widget is that approved
  // phase's deliverable. 5B.2's own boundary survives: IT shipped no
  // Today UI (no 5B.2 marker on the dashboard), and the widget that
  // now exists is explicitly the 5B.3 consumer.
  check('5B.2 itself shipped no Today widget (the one present is the approved 5B.3)',
    !read('src/app/(app)/dashboard/page.tsx').includes('5B.2') &&
    read('src/app/(app)/dashboard/page.tsx').includes('Phase 5B.3'))
  // RETARGETED (5B.4): 3E now consumes the 5B layers by design (the
  // approved Coach-integration phase). 5B.2's surviving claims: IT
  // changed nothing there, the apply path still runs through the
  // atomic RPC, and the 100/200 steps stand.
  check('3E apply path and step limits intact (5B.2 itself changed nothing there)',
    (() => {
      const g = read('src/lib/goal-adjustments.ts')
      return g.includes('export const CALORIE_STEP_SMALL = 100') &&
        g.includes('export const CALORIE_STEP_LARGE = 200') &&
        g.includes('validateAdjustmentApply')
    })())
  check('no decision_logs writes in the new scope',
    [route, factsLib, modelLib, toggle].every((f) =>
      !stripComments(f).includes('decision_logs')))
  check('no nutrition_targets writes (reads/type-shape only)',
    !stripComments(route).includes('nutrition_targets') &&
    !/from\('nutrition_targets'\)[\s\S]{0,120}\.(insert|update|upsert|delete)/.test(modelLib) &&
    !/from\('nutrition_targets'\)/.test(factsLib))
  check('no recommendation language in the new scope',
    [route, factsLib, modelLib, toggle].every((f) =>
      !/reduce (your )?calories|increase (your )?calories|should eat/i
        .test(stripComments(f))))
  // RETARGETED (5B.4): the flagged coach-signals completeness
  // correction made explicit_complete days count as trusted evidence
  // in the signal averages/confidence — the approved fix for the
  // 5B.1-era heuristic-only filter. 5B.2's surviving claim: the
  // signals layer still has no inference or day-status coupling.
  check('coach-signals has no inference/day-status coupling (5B.4 completeness fix aside)',
    (() => {
      const s = stripComments(read('src/lib/coach-signals.ts'))
      return !s.includes('inferAdaptiveMaintenance') &&
        !s.includes('nutrition_day_status')
    })())
  check('5B.1 modules remain compatible (verify-phase5b1 exists and imports resolve)',
    existsSync('scripts/verify-phase5b1.ts'))
  check('exactly the 6 approved feature files carry 5B.2 markers',
    ['src/types/database.ts', 'src/app/api/nutrition/day-status/route.ts',
      'src/lib/energy-facts.ts', 'src/lib/energy-model.ts',
      'src/components/food/DayCompleteToggle.tsx', 'src/app/(app)/food/page.tsx']
      .every((f) => read(f).includes('5B.2')))
  check('no other page/component gained 5B.2 code',
    !read('src/app/(app)/check-in/page.tsx').includes('5B.2') &&
    !read('src/app/(app)/progress/page.tsx').includes('5B.2') &&
    !read('src/lib/weekly-review.ts').includes('5B.2'))
}

// ── 12. Docs and hygiene ─────────────────────────────────────────────
console.log('\n12. Docs and hygiene')
{
  check('notes document migration 019 and absence semantics',
    notes.includes('019') && notes.includes('never explicitly incomplete'))
  check('notes document the explicit-vs-heuristic hierarchy',
    notes.includes('explicit_complete > likely_complete'))
  check('notes document historical target resolution',
    notes.includes('resolveTargetForDate') && notes.includes('retroactively'))
  check('notes document the maintenance math with the 3500 approximation',
    notes.includes('3500') && (notes.includes('approximation') || notes.includes('APPROXIMATION')))
  check('notes document bounded adaptation (100/week + 25% clamp)',
    notes.includes('100 kcal') && notes.includes('25%'))
  check('notes document outlier reason codes',
    notes.includes('extreme_weight_change') && notes.includes('implausible_low_intake'))
  check('notes document no-double-count and Friday support',
    notes.includes('double-count') && notes.includes('Friday'))
  check('notes flag every retarget', /retarget/i.test(notes))
  check('notes record the migration-apply + hosted QA protocol',
    notes.includes('ttybyljytiwntvorugcv') && notes.includes('phase5b2-qa'))
  check('no emoji/pictographs in changed files',
    CHANGED.every((f) => !EMOJI.test(f)) && !EMOJI.test(migration) && !EMOJI.test(notes))
  check('no legacy brand violations',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 13. Runtime: extended matrices ───────────────────────────────────
console.log('\n13. Runtime: extended matrices')
{
  const inferWith = (calsByWeek: number[], anchorsByWeek: Array<number | null>, extra?: {
    explicit?: boolean; daysSinceTargetChange?: number | null; baseline?: typeof BASELINE_190
  }) => inferAdaptiveMaintenance({
    baseline: extra?.baseline ?? BASELINE_190,
    weeks: standardWeeks({ calsByWeek, anchorsByWeek, explicit: extra?.explicit }),
    daysSinceTargetChange: extra?.daysSinceTargetChange ?? null,
  })

  // Maintenance math across weekly rates at 2,000 intake:
  // observed = 2000 - rate x 500.
  for (const rate of [-1.5, -1, -0.5, -0.25, 0, 0.25, 0.5, 1, 1.5]) {
    const anchors = [190, 190 + rate, 190 + 2 * rate, 190 + 3 * rate]
    const e = inferWith([2000, 2000, 2000, 2000], anchors)
    // observed = intake - rate x (3500/7) = 2000 - rate x 500
    check(`runtime: rate matrix — ${rate} lb/wk at 2,000 intake -> observed ${2000 - rate * 500}`,
      e.observedMaintenance === Math.round(2000 - rate * 500))
  }

  // Bounded adaptation across flat-weight intakes (4 qualifying weeks:
  // evidence bound 400; clamp 570 for the 2,280 baseline).
  for (const intake of [1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000]) {
    const raw = intake - BASELINE_190.primaryEstimate
    const bounded = Math.sign(raw) * Math.min(Math.abs(raw), 400, 570)
    const e = inferWith([intake, intake, intake, intake], [190, 190, 190, 190])
    check(`runtime: bounded matrix — flat weight at ${intake} intake -> central ${BASELINE_190.primaryEstimate + bounded}`,
      e.adaptiveCentral === BASELINE_190.primaryEstimate + bounded)
  }

  // Three qualifying weeks: evidence bound 300.
  for (const intake of [1700, 1900, 2600, 2800]) {
    const raw = intake - BASELINE_190.primaryEstimate
    const bounded = Math.sign(raw) * Math.min(Math.abs(raw), 300, 570)
    const e = inferWith([intake, intake, intake, intake], [null, 190, 190, 190])
    check(`runtime: 3-week bound — ${intake} intake -> central ${BASELINE_190.primaryEstimate + bounded}`,
      e.evidence.weeksQualified === 3 &&
      e.adaptiveCentral === BASELINE_190.primaryEstimate + bounded)
  }

  // Historical target resolution matrix over three versions.
  const HISTORY3 = [
    { effective_date: '2026-06-01', calories: 2400 },
    { effective_date: '2026-07-01', calories: 2200 },
    { effective_date: '2026-08-01', calories: 2000 },
  ]
  for (const [date, expected] of [
    ['2026-05-31', null], ['2026-06-01', 2400], ['2026-06-30', 2400],
    ['2026-07-15', 2200], ['2026-08-01', 2000], ['2026-12-25', 2000],
  ] as const) {
    check(`runtime: target resolution — ${date} -> ${expected ?? 'null'}`,
      (resolveTargetForDate(HISTORY3, date)?.calories ?? null) === expected)
  }

  // Completeness hierarchy matrix: [explicit, dailyCal, entries] ->
  // expected completeness (target 2,000 -> heuristic floor 900).
  for (const [explicit, cal, entries, expected] of [
    [false, 2000, 2, 'likely_complete'], [true, 2000, 2, 'explicit_complete'],
    [false, 600, 2, 'partial'], [true, 600, 2, 'explicit_complete'],
    [false, 1500, 1, 'partial'], [true, 1500, 1, 'explicit_complete'],
    [false, 0, 0, 'missing'], [true, 0, 0, 'missing'],
  ] as const) {
    const rows = entries === 0 ? [] :
      entries === 1 ? [food('2026-08-05', cal)] :
      [food('2026-08-05', Math.round(cal * 0.6)), food('2026-08-05', cal - Math.round(cal * 0.6))]
    const f = buildDailyNutritionFactsWithContext(rows, '2026-08-05', '2026-08-05', {
      targetHistory: TARGETS_2000,
      explicitCompleteDates: new Set(explicit ? ['2026-08-05'] : []),
    })[0]
    check(`runtime: hierarchy matrix — explicit=${explicit} ${cal}kcal/${entries}e -> ${expected}`,
      f.completeness === expected)
  }

  // Migration status vocabulary bans, individually pinned.
  for (const banned of ["'partial'", "'incomplete'", "'skipped'", "'estimated'"]) {
    check(`migration: ${banned} is not a storable status`,
      !stripSql(migration).includes(banned))
  }
  // The four policy names, individually pinned.
  for (const policy of ['select_own', 'insert_own', 'update_own', 'delete_own']) {
    check(`migration: policy nutrition_day_status_${policy} exists`,
      migration.includes(`CREATE POLICY nutrition_day_status_${policy}`))
  }

  // Named constants, individually pinned.
  check('constant: INFERENCE_WINDOW_DAYS = 28', INFERENCE_WINDOW_DAYS === 28)
  check('constant: MAX_INFERENCE_WEEKS = 4', MAX_INFERENCE_WEEKS === 4)
  check('constant: MIN_QUALIFYING_WEEKS = 3', MIN_QUALIFYING_WEEKS === 3)
  check('constant: MIN_COMPLETE_DAYS_PER_WEEK = 5', MIN_COMPLETE_DAYS_PER_WEEK === 5)
  check('constant: KCAL_PER_LB = 3500', KCAL_PER_LB === 3500)
  check('constant: ADAPTIVE_STEP_PER_WEEK_KCAL = 100', ADAPTIVE_STEP_PER_WEEK_KCAL === 100)
  check('constant: ADAPTIVE_CLAMP_FRACTION = 0.25', ADAPTIVE_CLAMP_FRACTION === 0.25)
  check('constant: OUTLIER_WEEKLY_CHANGE_PCT = 1.5', OUTLIER_WEEKLY_CHANGE_PCT === 1.5)
  check('constant: MAINTENANCE_RANGE_ROUNDING = 50', MAINTENANCE_RANGE_ROUNDING === 50)

  // Evidence-quality discrimination: explicit days alone feed the
  // mean when >= 5 exist, even when heuristic days differ wildly.
  check('runtime: explicit-majority week averages EXPLICIT days only',
    (() => {
      const monday = '2026-08-03'
      const rows = [
        ...weekRows(monday, 2000, 5),                       // Mon-Fri explicit
        food(dayOf(monday, 5), 1800), food(dayOf(monday, 5), 1200), // Sat 3,000 heuristic
      ]
      const facts = buildDailyNutritionFactsWithContext(rows, monday, WINDOW_END, {
        targetHistory: TARGETS_2000,
        explicitCompleteDates: new Set(weekDates(monday, 5)),
      })
      const w = buildQualifyingWeeks({
        nutritionFacts: facts, anchors: [anchor(monday, 190)], endDate: WINDOW_END,
      })
      const target = w.find((x) => x.weekStart === monday)!
      return target.evidenceQuality === 'explicit' && target.avgCalories === 2000 &&
        target.heuristicCompleteDays === 1
    })())
  check('runtime: 4 explicit + 1 heuristic day -> combined fallback tier',
    (() => {
      const monday = '2026-08-03'
      const rows = weekRows(monday, 2000, 5)
      const facts = buildDailyNutritionFactsWithContext(rows, monday, WINDOW_END, {
        targetHistory: TARGETS_2000,
        explicitCompleteDates: new Set(weekDates(monday, 4)),
      })
      const w = buildQualifyingWeeks({
        nutritionFacts: facts, anchors: [anchor(monday, 190)], endDate: WINDOW_END,
      })
      const target = w.find((x) => x.weekStart === monday)!
      return target.evidenceQuality === 'heuristic' &&
        target.explicitCompleteDays === 4 && target.heuristicCompleteDays === 1 &&
        target.avgCalories === 2000 && target.qualifies
    })())
  check('runtime: 4 complete days total -> week does not qualify',
    (() => {
      const monday = '2026-08-03'
      const facts = buildDailyNutritionFactsWithContext(
        weekRows(monday, 2000, 4), monday, WINDOW_END, {
          targetHistory: TARGETS_2000,
          explicitCompleteDates: new Set(weekDates(monday, 4)),
        })
      const w = buildQualifyingWeeks({
        nutritionFacts: facts, anchors: [anchor(monday, 190)], endDate: WINDOW_END,
      })
      return !w.find((x) => x.weekStart === monday)!.qualifies
    })())
  check('runtime: partial days inside a qualifying week are ignored, never zero-filled',
    (() => {
      const monday = '2026-08-03'
      const rows = [...weekRows(monday, 2000, 5), food(dayOf(monday, 5), 200)]
      const facts = buildDailyNutritionFactsWithContext(rows, monday, WINDOW_END, {
        targetHistory: TARGETS_2000,
        explicitCompleteDates: new Set(weekDates(monday, 5)),
      })
      const w = buildQualifyingWeeks({
        nutritionFacts: facts, anchors: [anchor(monday, 190)], endDate: WINDOW_END,
      })
      return w.find((x) => x.weekStart === monday)!.avgCalories === 2000
    })())

  // End-to-end Friday proof: raw weigh-in rows -> anchors -> weeks ->
  // inference, one weigh-in per week.
  check('runtime: END-TO-END FRIDAY — four raw Friday weigh-ins carry a full inference',
    (() => {
      const weighRows = [
        { logged_date: '2026-07-17', weight_kg: 86.18, created_at: '2026-07-17T07:00:00Z' },
        { logged_date: '2026-07-24', weight_kg: 85.73, created_at: '2026-07-24T07:00:00Z' },
        { logged_date: '2026-07-31', weight_kg: 85.28, created_at: '2026-07-31T07:00:00Z' },
        { logged_date: '2026-08-07', weight_kg: 84.82, created_at: '2026-08-07T07:00:00Z' },
      ]
      const anchors = deriveWeeklyWeightAnchors(weighRows, WINDOW_END)
      const facts = buildDailyNutritionFactsWithContext(
        MONDAYS.flatMap((m) => weekRows(m, 2000)), WINDOW_START, WINDOW_END, {
          targetHistory: TARGETS_2000,
          explicitCompleteDates: new Set(MONDAYS.flatMap((m) => weekDates(m))),
        })
      const weeks = buildQualifyingWeeks({ nutritionFacts: facts, anchors, endDate: WINDOW_END })
      const e = inferAdaptiveMaintenance({
        baseline: BASELINE_190, weeks, daysSinceTargetChange: null,
      })
      return anchors.length === 4 && anchors.every((a) => a.quality === 'single') &&
        e.status === 'high_confidence' && e.observedMaintenance !== null &&
        e.observedMaintenance > 2400 && e.observedMaintenance < 2600
    })())

  // Range arithmetic recomputed independently.
  for (const [cals, anchors] of [
    [[2000, 2000, 2000, 2000], [190, 189, 188, 187]],
    [[2400, 2400, 2400, 2400], [190, 190, 190, 190]],
    [[1800, 1800, 1800, 1800], [190, 189.6, 189.2, 188.8]],
  ] as const) {
    const e = inferWith([...cals], [...anchors])
    const half = e.status === 'high_confidence' ? 100 : e.status === 'moderate_confidence' ? 150 : 200
    check(`runtime: range arithmetic — central ${e.adaptiveCentral} -> [${e.estimatedMaintenanceRange}]`,
      e.estimatedMaintenanceRange !== null && e.adaptiveCentral !== null &&
      e.estimatedMaintenanceRange[0] === Math.round((e.adaptiveCentral - half) / 50) * 50 &&
      e.estimatedMaintenanceRange[1] === Math.round((e.adaptiveCentral + half) / 50) * 50)
  }

  // Status extremes.
  check('runtime: zero qualifying weeks -> insufficient_data',
    inferWith([2000, 2000, 2000, 2000], [null, null, null, null]).status === 'insufficient_data')
  check('runtime: one qualifying week -> insufficient_data',
    inferWith([2000, 2000, 2000, 2000], [null, null, null, 187]).status === 'insufficient_data')
  check('runtime: 3 heuristic weeks stay observing (never jump tiers)',
    (() => {
      const e = inferWith([2000, 2000, 2000, 2000], [null, 190, 189, 188], { explicit: false })
      return e.status === 'observing'
    })())
  check('runtime: implausible week exclusion drops 4 -> 3 -> observing',
    (() => {
      const e = inferWith([600, 2000, 2000, 2000], [190, 189, 188, 187])
      return e.evidence.weeksQualified === 3 && e.status === 'observing'
    })())
  check('runtime: all-excluded window -> insufficient with reasons',
    (() => {
      const e = inferWith([600, 600, 600, 600], [190, 189, 188, 187])
      return e.status === 'insufficient_data' &&
        e.confidence.reasons.includes('insufficient_qualifying_weeks')
    })())

  // Target-change boundary at 14 days.
  check('runtime: 13 days since target change -> recent_target_change reason',
    inferWith([2000, 2000, 2000, 2000], [190, 189, 188, 187], { daysSinceTargetChange: 13 })
      .confidence.reasons.includes('recent_target_change'))
  check('runtime: 14 days since target change -> no reason',
    !inferWith([2000, 2000, 2000, 2000], [190, 189, 188, 187], { daysSinceTargetChange: 14 })
      .confidence.reasons.includes('recent_target_change'))

  // Outliers in both directions.
  check('runtime: extreme DROP excluded', (() => {
    const w = standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 189.5, 185, 188.6] })
    return w[2].excluded
  })())
  check('runtime: extreme JUMP excluded', (() => {
    const w = standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 189.5, 194, 190.4] })
    return w[2].excluded && w[2].exclusionReasons.includes('extreme_weight_change')
  })())
  check('runtime: exclusion reasons stack (no anchor + thin nutrition on one week)',
    (() => {
      const facts = buildDailyNutritionFactsWithContext(
        [...weekRows('2026-07-20', 2000), ...weekRows('2026-07-27', 2000), ...weekRows('2026-08-03', 2000)],
        WINDOW_START, WINDOW_END, {
          targetHistory: TARGETS_2000,
          explicitCompleteDates: new Set(
            ['2026-07-20', '2026-07-27', '2026-08-03'].flatMap((m) => weekDates(m))),
        })
      const w = buildQualifyingWeeks({
        nutritionFacts: facts,
        anchors: [anchor('2026-07-20', 190), anchor('2026-07-27', 189), anchor('2026-08-03', 188)],
        endDate: WINDOW_END,
      })
      return w[0].exclusionReasons.includes('insufficient_nutrition_days') &&
        w[0].exclusionReasons.includes('no_weight_anchor')
    })())

  // Structural odds and ends.
  check('runtime: multi-quality anchors flow through identically',
    (() => {
      const weeks = standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 189, 188, 187] })
        .map((w) => w.weightAnchor
          ? { ...w, weightAnchor: { ...w.weightAnchor, quality: 'multi' as const, contributingDates: 2 } }
          : w)
      const e = inferAdaptiveMaintenance({ baseline: BASELINE_190, weeks, daysSinceTargetChange: null })
      return e.observedMaintenance === 2500
    })())
  check('runtime: avgQualifiedIntake and observed are rounded integers',
    (() => {
      const e = inferWith([2001, 2003, 1999, 2002], [190, 189, 188, 187])
      return Number.isInteger(e.avgQualifiedIntake) && Number.isInteger(e.observedMaintenance)
    })())
  check('runtime: baseline object passes through unchanged',
    (() => {
      const e = inferWith([2000, 2000, 2000, 2000], [190, 189, 188, 187])
      return JSON.stringify(e.baseline) === JSON.stringify(BASELINE_190)
    })())
  check('runtime: inference never mutates its weeks input',
    (() => {
      const weeks = standardWeeks({ calsByWeek: [2000, 2000, 2000, 2000], anchorsByWeek: [190, 189, 188, 187] })
      const before = JSON.stringify(weeks)
      inferAdaptiveMaintenance({ baseline: BASELINE_190, weeks, daysSinceTargetChange: null })
      return JSON.stringify(weeks) === before
    })())
  check('runtime: explicit dates OUTSIDE the range are ignored',
    (() => {
      const f = buildDailyNutritionFactsWithContext(
        weekRows('2026-08-03', 2000, 1), '2026-08-03', '2026-08-03', {
          targetHistory: TARGETS_2000,
          explicitCompleteDates: new Set(['2026-01-01', '2026-08-03']),
        })
      return f.length === 1 && f[0].completeness === 'explicit_complete'
    })())
  check('runtime: mid-week endDate still partitions to the containing ISO week',
    (() => {
      const w = buildQualifyingWeeks({
        nutritionFacts: [], anchors: [], endDate: '2026-08-05', // a Wednesday
      })
      return w.length === 4 && w[3].weekStart === '2026-08-03' && w[0].weekStart === '2026-07-13'
    })())
  check('toggle: disabled while saving; distinct error paths',
    toggle.includes('disabled={saving}') &&
    (toggle.match(/setError\(/g) || []).length >= 5)
  // RETARGET (LOCAL-DATE-FIX): DateNav gained the resolved local
  // `today` prop (the UTC date-boundary correction); the boundary —
  // the nav and coach panel wiring survive intact — is unchanged.
  check('page: DateNav and coach panel untouched',
    foodPage.includes('function DateNav({ date, today }: { date: string; today: string })') &&
    foodPage.includes('<NutritionCoachPanel summary={nutritionSummary} />'))
}

// ── 14. Contract statics ─────────────────────────────────────────────
console.log('\n14. Contract statics')
{
  for (const method of ['GET', 'PUT', 'DELETE']) {
    check(`route: ${method} handler exported`,
      route.includes(`export async function ${method}(`))
  }
  check('route: PUT parses JSON defensively', route.includes('.catch(() => ({}))'))
  check('route: DELETE takes the date as a query param',
    route.includes("request.nextUrl.searchParams.get('date')"))
  check('page: day status fetched inside the parallel batch',
    foodPage.includes('dayStatusRes] = await Promise.all([') &&
    foodPage.includes('.maybeSingle(),'))
  check('model: qualifying-week + inference functions exported',
    modelLib.includes('export function buildQualifyingWeeks') &&
    modelLib.includes('export function inferAdaptiveMaintenance'))
  check('facts: context builder exported and shares the classification core',
    factsLib.includes('export function buildDailyNutritionFactsWithContext') &&
    (factsLib.match(/buildFactsCore\(/g) || []).length === 3)
  for (const field of ['id: string', 'user_id: string', 'logged_date: string',
    "status: 'complete'", 'created_at: string', 'updated_at: string']) {
    check(`types: NutritionDayStatus has ${field.split(':')[0].trim()}`,
      (() => {
        const block = types.slice(types.indexOf('export interface NutritionDayStatus'),
          types.indexOf('}', types.indexOf('export interface NutritionDayStatus')))
        return block.includes(field)
      })())
  }
  check('migration: trigger named for the table',
    migration.includes('CREATE TRIGGER nutrition_day_status_updated_at'))
  check('migration: status carries no DEFAULT (a row is always an explicit act)',
    !/status\s+TEXT\s+NOT\s+NULL\s+DEFAULT/.test(migration))
  check('notes: canonical example range recorded',
    notes.includes('2,500') || notes.includes('2500'))
  check('notes: status ladder recorded',
    notes.includes('insufficient_data') && notes.includes('observing') &&
    notes.includes('moderate_confidence') && notes.includes('high_confidence'))
  // Adherence classification across historical target eras.
  // 2,250 kcal: near vs 2,200 (2.3%), over vs 2,000 (12.5% — past
  // the exact-10% band edge).
  const eraFacts = buildDailyNutritionFactsWithContext(
    [food('2026-07-30', 1300), food('2026-07-30', 950),
     food('2026-08-05', 1300), food('2026-08-05', 950)],
    '2026-07-30', '2026-08-05',
    { targetHistory: [
      { effective_date: '2026-07-01', calories: 2200 },
      { effective_date: '2026-08-01', calories: 2000 },
    ], explicitCompleteDates: new Set(['2026-07-30', '2026-08-05']) })
  check('runtime: 2,250 kcal reads near vs the OLD 2,200 target era',
    eraFacts.find((f) => f.date === '2026-07-30')!.adherence === 'near')
  check('runtime: the SAME intake reads over vs the NEW 2,000 target era',
    eraFacts.find((f) => f.date === '2026-08-05')!.adherence === 'over')
  check('runtime: both era days are explicit_complete',
    eraFacts.filter((f) => f.completeness === 'explicit_complete').length === 2)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
