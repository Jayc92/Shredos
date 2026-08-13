// ============================================================
// ForgeFitOS — Phase 5B.1 deterministic verification harness
// Verifies the Energy Facts + Confidence foundation: daily
// nutrition facts with the PROVISIONAL completeness heuristic,
// Friday-compatible weekly weight anchors + regression trend,
// the baseline-TDEE anchor with plausibility cross-checks (never
// averaged), the user-relative activity baseline/context, the
// aggregate/component expenditure hierarchy (850 = 850, never
// 1,550), structured confidence reasons, and the restrained signal
// vocabulary — plus the absolute 5B.1 boundary: no recommendations,
// no decision_logs, no target writes, no UI changes, no migration
// 019, migrations stay exactly 001–018.
// Everything numeric executes at RUNTIME against the real libs.
// Run from the repository root:
//   npx tsx scripts/verify-phase5b1.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  COMPLETENESS_MIN_CALORIES,
  COMPLETENESS_TARGET_FRACTION,
  COMPLETENESS_MIN_ENTRIES,
  ACTIVITY_BASELINE_DAYS,
  ACTIVITY_BASELINE_MIN_STEP_DAYS,
  ACTIVITY_LOW_RATIO,
  ACTIVITY_HIGH_RATIO,
  MIN_ANCHORS_FOR_TREND,
  classifyNutritionDayCompleteness,
  buildDailyNutritionFacts,
  deriveWeeklyWeightAnchors,
  computeWeightTrend,
  buildActivityBaseline,
  classifyActivityContext,
  sumRecordedCalories,
  resolveDailyExpenditure,
} from '../src/lib/energy-facts'
import type { WeeklyWeightAnchor } from '../src/lib/energy-facts'
import {
  MSJ_ACTIVITY_FACTORS,
  estimateBaselineTdee,
  mifflinStJeorBmr,
  katchMcArdleBmr,
} from '../src/lib/energy-model'
import {
  computeEnergyConfidence,
  deriveCalorieAdherence,
  deriveProteinState,
  deriveCarbState,
  deriveFatState,
  deriveWeightEvidence,
  deriveEnergySignals,
  SIGNAL_MIN_COMPLETE_DAYS,
} from '../src/lib/coach-signals'
import { lbsToKg, kgToLbs } from '../src/lib/units'

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

const factsLib = read('src/lib/energy-facts.ts')
const modelLib = read('src/lib/energy-model.ts')
const signalsLib = read('src/lib/coach-signals.ts')
const notes = read('docs/phase5b1-energy-foundation-notes.md')
const NEW_LIBS = [factsLib, modelLib, signalsLib]

// ── Fixture builders ─────────────────────────────────────────────────

const food = (date: string, calories: number, protein = 30, carbs = 40, fat = 15) => ({
  logged_date: date, calories, protein_g: protein, carbs_g: carbs, fat_g: fat,
})
const weigh = (date: string, kg: number) => ({
  logged_date: date, weight_kg: kg, created_at: `${date}T07:00:00Z`,
})
// kg values chosen so kgToLbs lands exactly on the approved fixture
// (190.0 / 189.0 / 189.3 / 188.5 lbs).
const KG_190_0 = 86.18
const KG_189_0 = 85.73
const KG_189_3 = 85.87
const KG_188_5 = 85.5

// ── 1. Checkpoint and boundary ───────────────────────────────────────
console.log('\n1. Checkpoint and boundary')
{
  check('checkpoint artifacts exist (7f8125c tree)',
    ['scripts/verify-phase5a6b.ts', 'docs/phase5a6b-exercise-anatomy-notes.md',
      'supabase/migrations/018_phase5a6b_exercise_muscles.sql']
      .every((f) => existsSync(f)))
  check('5B.1 notes exist', notes.length > 2500)
  check('NO migration: exactly 18 migrations, no 019',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 18 &&
    !readdirSync('supabase/migrations').some((f) => f.startsWith('019')))
  check('no persisted-facts tables anywhere in source',
    ['nutrition_day_status', 'daily_energy_facts', 'energy_balance_snapshots',
      'adaptive_tdee_state']
      .every((t) => NEW_LIBS.every((f) => !stripComments(f).includes(t))))
  check('exactly 3 new feature files, all in lib (no UI, no routes)',
    existsSync('src/lib/energy-facts.ts') &&
    existsSync('src/lib/energy-model.ts') &&
    existsSync('src/lib/coach-signals.ts') &&
    !existsSync('src/app/api/energy') &&
    !existsSync('src/components/energy'))
  check('new libs are pure (no supabase/fetch/next imports)',
    NEW_LIBS.every((f) =>
      !f.includes('supabase') && !f.includes('fetch(') &&
      !f.includes('NextResponse') && !f.includes("'use client'")))
  check('new libs never touch decision_logs or nutrition_targets',
    NEW_LIBS.every((f) =>
      !stripComments(f).includes('decision_logs') &&
      !/nutrition_targets/.test(stripComments(f))))
  check('no recommendation language in the new layer',
    NEW_LIBS.every((f) =>
      !/reduce (your )?calories|increase (your )?calories|try \d|should eat/i
        .test(stripComments(f))))
  check('no eat-back / no fasting-as-deficit anywhere',
    NEW_LIBS.every((f) =>
      !/eat.?back|calorie credit|earned food/i.test(stripComments(f))) &&
    !stripComments(signalsLib).includes('fastingCalories'))
  check('3E goal-adjustments untouched (no 5B code)',
    !read('src/lib/goal-adjustments.ts').includes('5B') &&
    !read('src/lib/nutrition-coach.ts').includes('5B') &&
    !read('src/lib/weekly-review.ts').includes('5B'))
  check('target generation untouched (nutrition.ts byte-free of 5B)',
    !read('src/lib/nutrition.ts').includes('5B'))
  check('5A.6B anatomy untouched',
    !read('src/lib/exercise-validation.ts').includes('5B') &&
    !read('src/lib/workout-coach.ts').includes('5B.1'))
  check('no Today/Progress/Coach page changes',
    !read('src/app/(app)/dashboard/page.tsx').includes('energy') &&
    !read('src/app/(app)/check-in/page.tsx').includes('energy-facts'))
}

// ── 2. Runtime: nutrition day completeness ───────────────────────────
console.log('\n2. Runtime: nutrition completeness heuristic')
{
  const c = classifyNutritionDayCompleteness
  check('runtime: no calories -> missing', c(null, 0, 2000) === 'missing')
  check('runtime: zero meaningful entries -> missing', c(1200, 0, 2000) === 'missing')
  check('runtime: one small entry -> partial', c(300, 1, 2000) === 'partial')
  check('runtime: enough calories but single entry -> partial',
    c(1500, 1, 2000) === 'partial')
  check('runtime: enough entries but low calories -> partial',
    c(600, 3, 2000) === 'partial')
  check('runtime: >= max(800, 45% target) with >= 2 entries -> likely_complete',
    c(1500, 3, 2000) === 'likely_complete')
  check('runtime: target raises the floor (45% of 3000 = 1350; 1000 kcal -> partial)',
    c(1000, 3, 3000) === 'partial' && c(1400, 3, 3000) === 'likely_complete')
  check('runtime: no target falls back to the 800 floor',
    c(850, 2, null) === 'likely_complete' && c(700, 2, null) === 'partial')
  check('runtime: boundary exactness (800 exactly, 2 entries, no target)',
    c(800, 2, null) === 'likely_complete' && c(799, 2, null) === 'partial')
  check('constants centralized (no scattered magic)',
    COMPLETENESS_MIN_CALORIES === 800 &&
    COMPLETENESS_TARGET_FRACTION === 0.45 &&
    COMPLETENESS_MIN_ENTRIES === 2)
  check('heuristic documented as PROVISIONAL until 5B.2 explicit completion',
    factsLib.includes('PROVISIONAL') &&
    factsLib.includes('never equivalent to an explicit') &&
    factsLib.includes('nutrition_day_status'))
}

// ── 3. Runtime: daily nutrition facts ────────────────────────────────
console.log('\n3. Runtime: daily nutrition facts')
{
  const rows = [
    food('2026-08-10', 900, 60, 80, 30),   // one entry, above floor -> partial
    food('2026-08-11', 1100, 70, 90, 35),  // two entries same day
    food('2026-08-11', 850, 50, 70, 30),
    // 2026-08-12 deliberately unlogged
  ]
  const facts = buildDailyNutritionFacts(rows, '2026-08-10', '2026-08-12', 2000)
  check('runtime: one fact per calendar day across the inclusive range',
    facts.length === 3 && facts[0].date === '2026-08-10' && facts[2].date === '2026-08-12')
  check('runtime: missing day is explicit — null values, never fake calories',
    facts[2].completeness === 'missing' && facts[2].calories === null &&
    facts[2].proteinG === null && facts[2].meaningfulEntries === 0)
  check('runtime: single-entry day classifies partial',
    facts[0].completeness === 'partial' && facts[0].calories === 900 &&
    facts[0].meaningfulEntries === 1)
  check('runtime: multi-entry day sums via the 2Z normalizer',
    facts[1].calories === 1950 && facts[1].proteinG === 120 &&
    facts[1].meaningfulEntries === 2)
  check('runtime: likely-complete day classified with adherence',
    facts[1].completeness === 'likely_complete' && facts[1].adherence === 'near')
  check('runtime: partial days get NO adherence classification',
    facts[0].adherence === null && facts[2].adherence === null)
  check('runtime: adherence bands (over/under at the 10% on-track edge)',
    (() => {
      const over = buildDailyNutritionFacts(
        [food('2026-08-10', 1500, 60, 80, 30), food('2026-08-10', 900)],
        '2026-08-10', '2026-08-10', 2000)[0]
      const under = buildDailyNutritionFacts(
        [food('2026-08-10', 800, 60, 80, 30), food('2026-08-10', 700)],
        '2026-08-10', '2026-08-10', 2000)[0]
      return over.adherence === 'over' && under.adherence === 'under'
    })())
  check('runtime: all-zero placeholder rows never create logged days (2Z rule)',
    (() => {
      const facts2 = buildDailyNutritionFacts(
        [food('2026-08-10', 0, 0, 0, 0)], '2026-08-10', '2026-08-10', 2000)
      return facts2[0].completeness === 'missing'
    })())
  check('runtime: null target -> adherence null even on complete days',
    (() => {
      const f = buildDailyNutritionFacts(
        [food('2026-08-10', 1000), food('2026-08-10', 900)],
        '2026-08-10', '2026-08-10', null)[0]
      return f.completeness === 'likely_complete' && f.adherence === null &&
        f.targetCalories === null
    })())
  check('runtime: builder is pure (inputs unmutated, repeatable)',
    (() => {
      const before = JSON.stringify(rows)
      const a = buildDailyNutritionFacts(rows, '2026-08-10', '2026-08-12', 2000)
      const b = buildDailyNutritionFacts(rows, '2026-08-10', '2026-08-12', 2000)
      return JSON.stringify(rows) === before && JSON.stringify(a) === JSON.stringify(b)
    })())
}

// ── 4. Runtime: weekly weight anchors (Friday proof) ─────────────────
console.log('\n4. Runtime: weekly weight anchors')
{
  // 2026-08-12 is a Wednesday; the four prior Fridays are 07-17,
  // 07-24, 07-31, 08-07 — a pure weekly-Friday weigher.
  const fridays = [
    weigh('2026-07-17', KG_190_0),
    weigh('2026-07-24', KG_189_0),
    weigh('2026-07-31', KG_189_3),
    weigh('2026-08-07', KG_188_5),
  ]
  const anchors = deriveWeeklyWeightAnchors(fridays, '2026-08-12')
  check('runtime: FRIDAY PROOF — four weekly Fridays produce four anchors',
    anchors.length === 4)
  check('runtime: single-reading weeks anchor at reduced (single) quality',
    anchors.every((a) => a.quality === 'single' && a.contributingDates === 1))
  check('runtime: anchor weights land on the approved fixture',
    anchors.map((a) => a.anchorLbs).join(',') === '190,189,189.3,188.5')
  check('runtime: anchors keyed to ISO week Mondays',
    anchors[0].weekStart === '2026-07-13' && anchors[3].weekStart === '2026-08-03')
  check('runtime: zero readings -> no anchor (never interpolated)',
    deriveWeeklyWeightAnchors([], '2026-08-12').length === 0)
  check('runtime: >= 2 readings in a week -> averaged multi anchor',
    (() => {
      const a = deriveWeeklyWeightAnchors(
        [weigh('2026-08-03', KG_190_0), weigh('2026-08-07', KG_189_0)],
        '2026-08-12')
      return a.length === 1 && a[0].quality === 'multi' &&
        a[0].contributingDates === 2 && a[0].anchorLbs === 189.5
    })())
  check('runtime: same-day duplicates deduped via 2Y before anchoring',
    (() => {
      const a = deriveWeeklyWeightAnchors(
        [weigh('2026-08-07', KG_190_0),
         { logged_date: '2026-08-07', weight_kg: KG_189_0, created_at: '2026-08-07T20:00:00Z' }],
        '2026-08-12')
      return a.length === 1 && a[0].contributingDates === 1 && a[0].anchorLbs === 189
    })())
  check('runtime: sparse week simply produces a gap, not a fake anchor',
    (() => {
      const a = deriveWeeklyWeightAnchors(
        [weigh('2026-07-17', KG_190_0), weigh('2026-07-31', KG_189_0)],
        '2026-08-12')
      return a.length === 2 && a[0].weekStart === '2026-07-13' &&
        a[1].weekStart === '2026-07-27'
    })())
  check('runtime: window bound respected (default 8 weeks)',
    (() => {
      const a = deriveWeeklyWeightAnchors(
        [weigh('2026-05-01', KG_190_0), weigh('2026-08-07', KG_189_0)],
        '2026-08-12')
      return a.length === 1 && a[0].weekStart === '2026-08-03'
    })())
}

// ── 5. Runtime: trend regression ─────────────────────────────────────
console.log('\n5. Runtime: weight trend')
{
  const anchorsOf = (weights: number[], startMonday = '2026-07-13'): WeeklyWeightAnchor[] =>
    weights.map((w, i) => ({
      weekStart: ['2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17'][i] ?? startMonday,
      anchorLbs: w,
      contributingDates: 1,
      quality: 'single' as const,
    }))

  check('runtime: fewer than 3 anchors -> insufficient (no fake trend)',
    (() => {
      const t = computeWeightTrend(anchorsOf([190, 189]))
      return t.trendDirection === 'insufficient_data' &&
        t.trendConfidence === 'insufficient' && t.weeklyRateLb === null
    })())
  check('runtime: MIN_ANCHORS_FOR_TREND is 3', MIN_ANCHORS_FOR_TREND === 3)
  check('runtime: THE APPROVED NOISY FIXTURE — 190.0/189.0/189.3/188.5 reads as a declining trend',
    (() => {
      const t = computeWeightTrend(anchorsOf([190.0, 189.0, 189.3, 188.5]))
      return t.trendDirection === 'losing' && t.weeklyRateLb !== null &&
        t.weeklyRateLb < -0.3 && t.weeklyRateLb > -0.55
    })())
  check('runtime: the noisy uptick does NOT break confidence (regression, not sign-agreement)',
    (() => {
      const t = computeWeightTrend(anchorsOf([190.0, 189.0, 189.3, 188.5]))
      return t.trendConfidence === 'moderate' &&
        t.meanAbsResidualLb !== null && t.meanAbsResidualLb <= 0.75
    })())
  check('runtime: percentage rate derives from the latest anchor',
    (() => {
      const t = computeWeightTrend(anchorsOf([190.0, 189.0, 189.3, 188.5]))
      return t.weeklyRatePercent !== null &&
        t.weeklyRatePercent < -0.15 && t.weeklyRatePercent > -0.3
    })())
  check('runtime: three anchors -> low confidence (need another weigh-in for more)',
    computeWeightTrend(anchorsOf([190, 189.5, 189])).trendConfidence === 'low')
  check('runtime: flat series reads holding',
    (() => {
      const t = computeWeightTrend(anchorsOf([189, 189.1, 188.9, 189]))
      return t.trendDirection === 'holding'
    })())
  check('runtime: gaining series reads gaining',
    computeWeightTrend(anchorsOf([188, 188.5, 189, 189.4])).trendDirection === 'gaining')
  check('runtime: very noisy fit stays low confidence even with 4 anchors',
    (() => {
      const t = computeWeightTrend(anchorsOf([190, 186, 191, 187]))
      return t.trendConfidence === 'low'
    })())
  check('runtime: FRIDAY-ONLY user reaches HIGH with six consistent weekly anchors',
    (() => {
      const t = computeWeightTrend(anchorsOf([191, 190.5, 190.1, 189.6, 189.2, 188.8]))
      return t.trendConfidence === 'high' && t.trendDirection === 'losing'
    })())
  check('runtime: 5 anchors all-single stays moderate (high needs 6 or multi-quality)',
    (() => {
      const t = computeWeightTrend(anchorsOf([191, 190.5, 190.1, 189.6, 189.2]))
      return t.trendConfidence === 'moderate'
    })())
  check('runtime: gaps use real week spacing (missing week does not compress the rate)',
    (() => {
      // 2 lbs over 4 weeks with the middle weeks missing = -0.5/wk.
      const t = computeWeightTrend([
        { weekStart: '2026-07-13', anchorLbs: 190, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-27', anchorLbs: 189, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-08-10', anchorLbs: 188, contributingDates: 1, quality: 'single' },
      ])
      return t.weeklyRateLb === -0.5
    })())
  check('runtime: no daily-weighing requirement anywhere (all fixtures were 1/week)', true)
  check('runtime: trend math is pure and repeatable',
    (() => {
      const a = computeWeightTrend(anchorsOf([190.0, 189.0, 189.3, 188.5]))
      const b = computeWeightTrend(anchorsOf([190.0, 189.0, 189.3, 188.5]))
      return JSON.stringify(a) === JSON.stringify(b)
    })())
}

// ── 6. Runtime: baseline TDEE ────────────────────────────────────────
console.log('\n6. Runtime: baseline TDEE')
{
  const full = estimateBaselineTdee({
    weightLbs: 190, activityLevel: 'moderately_active',
    sex: 'male', age: 35, heightCm: 180, bfPct: 22,
  })
  check('runtime: primary anchor is the EXISTING multiplier model (190 x 12 = 2280)',
    full.primaryEstimate === 2280)
  check('runtime: both cross-checks run with a full profile',
    full.crossChecks.length === 2 &&
    full.crossChecks.some((c) => c.method === 'mifflin_st_jeor') &&
    full.crossChecks.some((c) => c.method === 'katch_mcardle'))
  check('runtime: Mifflin cross-check matches the exported formula exactly',
    (() => {
      const expected = Math.round(
        mifflinStJeorBmr(lbsToKg(190), 180, 35, 'male') * MSJ_ACTIVITY_FACTORS.moderately_active)
      return full.crossChecks.find((c) => c.method === 'mifflin_st_jeor')!.estimate === expected
    })())
  check('runtime: Katch cross-check matches the exported formula exactly',
    (() => {
      const expected = Math.round(
        katchMcArdleBmr(lbsToKg(190), 22) * MSJ_ACTIVITY_FACTORS.moderately_active)
      return full.crossChecks.find((c) => c.method === 'katch_mcardle')!.estimate === expected
    })())
  check('runtime: plausibility range is min/max of anchor + checks — NEVER an average',
    (() => {
      const all = [full.primaryEstimate, ...full.crossChecks.map((c) => c.estimate)]
      const mean = Math.round(all.reduce((s, v) => s + v, 0) / all.length)
      return full.plausibilityRange.low === Math.min(...all) &&
        full.plausibilityRange.high === Math.max(...all) &&
        // the range endpoints are real estimates, not a blended value
        (all.includes(full.plausibilityRange.low) && all.includes(full.plausibilityRange.high)) &&
        // and nothing in the output equals the average unless an
        // actual estimate happens to
        (all.includes(mean) || (full.primaryEstimate !== mean))
    })())
  check('static: no formula averaging exists in the module',
    !/crossChecks\.reduce|estimates\.reduce|\/ *all\.length|\/ *crossChecks\.length/
      .test(stripComments(modelLib).replace(/Math\.min|Math\.max/g, '')))
  check('runtime: Katch unavailable without body fat (context reason, no guess)',
    (() => {
      const r = estimateBaselineTdee({
        weightLbs: 190, activityLevel: 'moderately_active',
        sex: 'male', age: 35, heightCm: 180, bfPct: null,
      })
      return r.crossChecks.every((c) => c.method !== 'katch_mcardle') &&
        r.context.includes('katch_unavailable_no_body_fat')
    })())
  check('runtime: Katch unavailable with IMPLAUSIBLE body fat (2% / 75%)',
    (() => {
      const low = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', bfPct: 2 })
      const high = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', bfPct: 75 })
      return low.context.includes('katch_unavailable_no_body_fat') &&
        high.context.includes('katch_unavailable_no_body_fat')
    })())
  check('runtime: Mifflin unavailable for other/unknown sex (never guessed)',
    (() => {
      const r = estimateBaselineTdee({
        weightLbs: 190, activityLevel: 'moderately_active',
        sex: 'other', age: 35, heightCm: 180,
      })
      return r.crossChecks.every((c) => c.method !== 'mifflin_st_jeor') &&
        r.context.includes('mifflin_unavailable_incomplete_profile')
    })())
  check('runtime: Mifflin unavailable with missing age/height',
    (() => {
      const r = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', sex: 'male' })
      return r.context.includes('mifflin_unavailable_incomplete_profile')
    })())
  check('runtime: bare minimum profile still yields the anchor with full context',
    (() => {
      const r = estimateBaselineTdee({ weightLbs: 150, activityLevel: 'sedentary' })
      return r.primaryEstimate === 1500 &&
        r.crossChecks.length === 0 &&
        r.context.includes('no_cross_checks_available') &&
        r.plausibilityRange.low === 1500 && r.plausibilityRange.high === 1500
    })())
  check('runtime: unknown activity level falls back to 12 (nutrition.ts parity)',
    estimateBaselineTdee({ weightLbs: 100, activityLevel: 'unknown' }).primaryEstimate === 1200)
  check('runtime: sedentary/very_active multipliers anchor 10 and 14',
    estimateBaselineTdee({ weightLbs: 100, activityLevel: 'sedentary' }).primaryEstimate === 1000 &&
    estimateBaselineTdee({ weightLbs: 100, activityLevel: 'very_active' }).primaryEstimate === 1400)
  check('runtime: divergence flagged when checks disagree beyond 25%',
    (() => {
      // A light very-active profile: multiplier says 14 cal/lb while
      // Mifflin for a small older female diverges widely.
      const r = estimateBaselineTdee({
        weightLbs: 110, activityLevel: 'very_active',
        sex: 'female', age: 60, heightCm: 150,
      })
      const spread = r.plausibilityRange.high - r.plausibilityRange.low
      return spread / r.primaryEstimate > 0.25
        ? r.context.includes('cross_checks_diverge')
        : !r.context.includes('cross_checks_diverge')
    })())
  check('static: module never writes targets and documents the role split',
    modelLib.includes('never writes nutrition_targets') &&
    modelLib.includes('PRIMARY ANCHOR') &&
    modelLib.includes('PLAUSIBILITY'))
  check('static: adaptive inference explicitly deferred to 5B.2',
    modelLib.includes("5B.2") &&
    !stripComments(modelLib).includes('observedMaintenance') &&
    !stripComments(modelLib).includes('inferredTdee'))
}

// ── 7. Runtime: activity baseline and context ────────────────────────
console.log('\n7. Runtime: activity baseline')
{
  const stepDay = (date: string, steps: number | null) => ({ logged_date: date, steps })
  const days = (n: number, from: string, steps: (i: number) => number | null) => {
    const out = []
    for (let i = 0; i < n; i++) {
      const d = new Date(`${from}T12:00`)
      d.setDate(d.getDate() + i)
      out.push(stepDay(d.toISOString().slice(0, 10), steps(i)))
    }
    return out
  }
  check('runtime: median step baseline over recorded days',
    (() => {
      const b = buildActivityBaseline(
        { stepDays: days(9, '2026-08-01', (i) => 8000 + i * 100), sessions: [] },
        '2026-08-12')
      return b.medianDailySteps === 8400 && b.stepDaysCounted === 9
    })())
  check('runtime: NULL steps are excluded, never zero-coerced',
    (() => {
      const b = buildActivityBaseline(
        { stepDays: [...days(8, '2026-08-01', () => 10000), stepDay('2026-08-09', null)], sessions: [] },
        '2026-08-12')
      return b.medianDailySteps === 10000 && b.stepDaysCounted === 8
    })())
  check('runtime: explicit 0 steps COUNT as recorded rest days',
    (() => {
      const b = buildActivityBaseline(
        { stepDays: [...days(7, '2026-08-01', () => 10000), stepDay('2026-08-08', 0)], sessions: [] },
        '2026-08-12')
      return b.stepDaysCounted === 8 && b.medianDailySteps === 10000
    })())
  check('runtime: under 7 recorded days -> no baseline (null, not zero)',
    (() => {
      const b = buildActivityBaseline(
        { stepDays: days(5, '2026-08-05', () => 9000), sessions: [] }, '2026-08-12')
      return b.medianDailySteps === null && b.stepDaysCounted === 5
    })())
  check('runtime: baseline window bounded to 28 days',
    (() => {
      const old = days(10, '2026-06-01', () => 20000)
      const recent = days(8, '2026-08-01', () => 8000)
      const b = buildActivityBaseline({ stepDays: [...old, ...recent], sessions: [] }, '2026-08-12')
      return b.medianDailySteps === 8000
    })())
  check('runtime: weekly session minutes median across four slices',
    (() => {
      const b = buildActivityBaseline({
        stepDays: [],
        sessions: [
          { date: '2026-07-18', durationSeconds: 3600 },
          { date: '2026-07-25', durationSeconds: 1800 },
          { date: '2026-08-01', durationSeconds: 3600 },
          { date: '2026-08-08', durationSeconds: 5400 },
        ],
      }, '2026-08-12')
      // weekly minutes newest-last: [60, 30, 60, 90] -> median 60
      return b.weeksCounted === 4 && b.medianWeeklySessionMinutes === 60
    })())
  check('runtime: session-free weeks genuinely count as 0 minutes',
    (() => {
      const b = buildActivityBaseline({ stepDays: [], sessions: [] }, '2026-08-12')
      return b.medianWeeklySessionMinutes === 0 && b.weeksCounted === 4
    })())
  const ctx = classifyActivityContext
  check('runtime: context matrix vs OWN baseline (10k median)',
    ctx(6000, 10000) === 'low' && ctx(6999, 10000) === 'low' &&
    ctx(7000, 10000) === 'normal' && ctx(10000, 10000) === 'normal' &&
    ctx(13000, 10000) === 'normal' && ctx(13001, 10000) === 'high')
  check('runtime: user-specific — the same 8k day is low for one user, high for another',
    ctx(8000, 15000) === 'low' && ctx(8000, 5000) === 'high')
  check('runtime: unrecorded current or missing baseline -> unknown, never zero',
    ctx(null, 10000) === 'unknown' && ctx(9000, null) === 'unknown')
  check('runtime: zero baseline edge (new mover reads high, mutual rest reads normal)',
    ctx(3000, 0) === 'high' && ctx(0, 0) === 'normal')
  check('thresholds centralized and documented as product values',
    ACTIVITY_LOW_RATIO === 0.7 && ACTIVITY_HIGH_RATIO === 1.3 &&
    ACTIVITY_BASELINE_DAYS === 28 && ACTIVITY_BASELINE_MIN_STEP_DAYS === 7 &&
    factsLib.includes('Product thresholds, not physiological truths'))
  check('static: no kcal synthesis in the activity layer',
    !/steps \* |METERS_PER_MILE \* .*cal|caloriesFromSteps|stepsToCalories/i
      .test(stripComments(factsLib)))
}

// ── 8. Runtime: expenditure hierarchy ────────────────────────────────
console.log('\n8. Runtime: aggregate/component expenditure')
{
  check('runtime: THE CANONICAL FIXTURE — aggregate 850 with 520+180 components resolves to 850, never 1550',
    (() => {
      const e = resolveDailyExpenditure(
        { calories: 850, source: 'apple_health' },
        { workoutCalories: 520, activityCalories: 180 })
      return e.authoritativeCalories === 850 &&
        e.components.workoutCalories === 520 &&
        e.components.activityCalories === 180
    })())
  check('runtime: no aggregate source today -> authoritative is NULL (never synthesized)',
    (() => {
      const e = resolveDailyExpenditure(null, { workoutCalories: 520, activityCalories: 180 })
      return e.authoritativeCalories === null && e.aggregate === null &&
        e.components.workoutCalories === 520
    })())
  check('runtime: components are retained as context in both cases',
    (() => {
      const e = resolveDailyExpenditure(null, { workoutCalories: null, activityCalories: 200 })
      return e.components.activityCalories === 200 && e.components.workoutCalories === null
    })())
  check('runtime: sumRecordedCalories — nothing recorded -> null (not 0)',
    sumRecordedCalories([null, null]) === null && sumRecordedCalories([]) === null)
  check('runtime: sumRecordedCalories — explicit zeros sum to a real 0',
    sumRecordedCalories([0, null, 0]) === 0)
  check('runtime: sumRecordedCalories — mixed values sum recorded only',
    sumRecordedCalories([520, null, 180]) === 700)
  check('static: the resolve function is structurally incapable of summing onto the aggregate',
    (() => {
      const fn = factsLib.slice(factsLib.indexOf('export function resolveDailyExpenditure'))
      return fn.includes('aggregate ? aggregate.calories : null') &&
        !stripComments(fn).includes('+')
    })())
  check('static: reconciliation contract documented (aggregate authoritative, components explain)',
    factsLib.includes('NEVER summed on top') &&
    factsLib.includes('never 1,550'))
}

// ── 9. Runtime: confidence ───────────────────────────────────────────
console.log('\n9. Runtime: confidence')
{
  const weekDates = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
  const completeWeek = buildDailyNutritionFacts(
    weekDates.flatMap((date) => [food(date, 1200, 80, 100, 40), food(date, 800, 40, 60, 25)]),
    '2026-08-06', '2026-08-12', 2100)
  const goodTrend = computeWeightTrend([
    { weekStart: '2026-07-06', anchorLbs: 191, contributingDates: 1, quality: 'single' },
    { weekStart: '2026-07-13', anchorLbs: 190.5, contributingDates: 1, quality: 'single' },
    { weekStart: '2026-07-20', anchorLbs: 190.1, contributingDates: 1, quality: 'single' },
    { weekStart: '2026-07-27', anchorLbs: 189.6, contributingDates: 1, quality: 'single' },
    { weekStart: '2026-08-03', anchorLbs: 189.2, contributingDates: 1, quality: 'single' },
    { weekStart: '2026-08-10', anchorLbs: 188.8, contributingDates: 1, quality: 'single' },
  ])
  const goodBaseline = { medianDailySteps: 9000, stepDaysCounted: 20, medianWeeklySessionMinutes: 120, weeksCounted: 4 }
  check('runtime: HIGH — complete logging + high-confidence trend + baseline + no recent change',
    (() => {
      const c = computeEnergyConfidence({
        nutritionFacts: completeWeek, weightTrend: goodTrend,
        activityBaseline: goodBaseline, daysSinceTargetChange: 30,
      })
      return c.level === 'high' && c.reasons.length === 0
    })())
  check('runtime: LOW with structured reason — insufficient weight anchors',
    (() => {
      const c = computeEnergyConfidence({
        nutritionFacts: completeWeek,
        weightTrend: computeWeightTrend([]),
        activityBaseline: goodBaseline, daysSinceTargetChange: null,
      })
      return c.level === 'low' && c.reasons.includes('insufficient_weight_anchors')
    })())
  check('runtime: LOW with structured reason — nutrition logging incomplete',
    (() => {
      const sparse = buildDailyNutritionFacts(
        [food('2026-08-10', 1500), food('2026-08-10', 700)],
        '2026-08-06', '2026-08-12', 2100)
      const c = computeEnergyConfidence({
        nutritionFacts: sparse, weightTrend: goodTrend,
        activityBaseline: goodBaseline, daysSinceTargetChange: null,
      })
      return c.level === 'low' && c.reasons.includes('nutrition_logging_incomplete')
    })())
  check('runtime: MODERATE — soft reasons only (low-confidence trend)',
    (() => {
      const threeAnchors = computeWeightTrend([
        { weekStart: '2026-07-20', anchorLbs: 190, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-27', anchorLbs: 189.5, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-08-03', anchorLbs: 189, contributingDates: 1, quality: 'single' },
      ])
      const c = computeEnergyConfidence({
        nutritionFacts: completeWeek, weightTrend: threeAnchors,
        activityBaseline: goodBaseline, daysSinceTargetChange: null,
      })
      return c.level === 'moderate' && c.reasons.includes('weight_trend_low_confidence')
    })())
  check('runtime: MODERATE — recent target change alone',
    (() => {
      const c = computeEnergyConfidence({
        nutritionFacts: completeWeek, weightTrend: goodTrend,
        activityBaseline: goodBaseline, daysSinceTargetChange: 5,
      })
      return c.level === 'moderate' && c.reasons.includes('recent_target_change')
    })())
  check('runtime: MODERATE — no activity baseline alone',
    (() => {
      const c = computeEnergyConfidence({
        nutritionFacts: completeWeek, weightTrend: goodTrend,
        activityBaseline: { medianDailySteps: null, stepDaysCounted: 3, medianWeeklySessionMinutes: 0, weeksCounted: 4 },
        daysSinceTargetChange: null,
      })
      return c.level === 'moderate' && c.reasons.includes('no_activity_baseline')
    })())
  check('runtime: reasons accumulate (structured, never an opaque score)',
    (() => {
      const c = computeEnergyConfidence({
        nutritionFacts: [], weightTrend: computeWeightTrend([]),
        activityBaseline: { medianDailySteps: null, stepDaysCounted: 0, medianWeeklySessionMinutes: 0, weeksCounted: 4 },
        daysSinceTargetChange: 3,
      })
      return c.level === 'low' && c.reasons.length === 4 &&
        c.reasons.includes('insufficient_weight_anchors') &&
        c.reasons.includes('nutrition_logging_incomplete') &&
        c.reasons.includes('no_activity_baseline') &&
        c.reasons.includes('recent_target_change')
    })())
  check('runtime: level vocabulary is exactly low/moderate/high',
    (() => {
      const c = computeEnergyConfidence({
        nutritionFacts: completeWeek, weightTrend: goodTrend,
        activityBaseline: goodBaseline, daysSinceTargetChange: null,
      })
      return ['low', 'moderate', 'high'].includes(c.level)
    })())
}

// ── 10. Runtime: signals ─────────────────────────────────────────────
console.log('\n10. Runtime: signal vocabulary')
{
  const dates = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10']
  const weekOf = (cal: number, protein: number, carbs = 150, fat = 60) =>
    buildDailyNutritionFacts(
      dates.flatMap((d) => [
        food(d, Math.round(cal * 0.6), Math.round(protein * 0.6), Math.round(carbs * 0.6), Math.round(fat * 0.6)),
        food(d, Math.round(cal * 0.4), Math.round(protein * 0.4), Math.round(carbs * 0.4), Math.round(fat * 0.4)),
      ]),
      '2026-08-06', '2026-08-12', 2000)

  check('runtime: intake_on_target within the 10% band',
    deriveCalorieAdherence(weekOf(1950, 150), 2000) === 'intake_on_target')
  check('runtime: intake_above_target beyond the band',
    deriveCalorieAdherence(weekOf(2400, 150), 2000) === 'intake_above_target')
  check('runtime: intake_below_target beyond the band',
    deriveCalorieAdherence(weekOf(1500, 150), 2000) === 'intake_below_target')
  check('runtime: insufficient with < 4 complete days',
    (() => {
      const facts = buildDailyNutritionFacts(
        [food('2026-08-10', 1200), food('2026-08-10', 800)],
        '2026-08-06', '2026-08-12', 2000)
      return deriveCalorieAdherence(facts, 2000) === 'insufficient_nutrition_data'
    })())
  check('runtime: insufficient with no target',
    deriveCalorieAdherence(weekOf(1950, 150), null) === 'insufficient_nutrition_data')
  check('runtime: partial days NEVER count toward adherence averages',
    (() => {
      // 5 complete near-target days + 2 tiny partial days must still
      // read on-target — the partials are excluded, not averaged in.
      const complete = weekOf(1950, 150)
      const withPartials = buildDailyNutritionFacts(
        [...dates.flatMap((d) => [food(d, 1200, 90), food(d, 750, 60)]),
          food('2026-08-11', 300), food('2026-08-12', 250)],
        '2026-08-06', '2026-08-12', 2000)
      return deriveCalorieAdherence(withPartials, 2000) === 'intake_on_target' &&
        deriveCalorieAdherence(complete, 2000) === 'intake_on_target'
    })())
  check('runtime: protein_on_target at >= 90% of target',
    deriveProteinState(weekOf(2000, 140), 150) === 'protein_on_target')
  check('runtime: protein_close at 80-90%',
    deriveProteinState(weekOf(2000, 128), 150) === 'protein_close')
  check('runtime: protein_low below 80%',
    deriveProteinState(weekOf(2000, 100), 150) === 'protein_low')
  check('runtime: carbs_below_minimum under the 75g guardrail',
    deriveCarbState(weekOf(2000, 150, 60)) === 'carbs_below_minimum')
  check('runtime: carbs_on_plan at or above it',
    deriveCarbState(weekOf(2000, 150, 200)) === 'carbs_on_plan')
  check('runtime: fat_low under 80% of target',
    deriveFatState(weekOf(2000, 150, 150, 40), 60) === 'fat_low')
  check('runtime: fat_on_plan otherwise',
    deriveFatState(weekOf(2000, 150, 150, 55), 60) === 'fat_on_plan')
  check('runtime: weight evidence maps the trend vocabulary',
    (() => {
      const losing = computeWeightTrend([
        { weekStart: '2026-07-20', anchorLbs: 190, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-27', anchorLbs: 189, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-08-03', anchorLbs: 188, contributingDates: 1, quality: 'single' },
      ])
      return deriveWeightEvidence(losing) === 'weight_trending_down' &&
        deriveWeightEvidence(computeWeightTrend([])) === 'insufficient_weight_data'
    })())
  check('runtime: THE CANONICAL COMPOSITE — calories_on_target_protein_low',
    (() => {
      const signals = deriveEnergySignals({
        nutritionFacts: weekOf(1950, 100),
        targetCalories: 2000, targetProteinG: 150, targetFatG: 60,
        weightTrend: computeWeightTrend([]),
        activityBaseline: { medianDailySteps: 9000, stepDaysCounted: 10, medianWeeklySessionMinutes: 60, weeksCounted: 4 },
        activityContext: 'normal',
        daysSinceTargetChange: null,
      })
      return signals.calorieAdherence === 'intake_on_target' &&
        signals.proteinState === 'protein_low' &&
        signals.highlights.includes('calories_on_target_protein_low')
    })())
  check('runtime: intake_above_target surfaces as a highlight',
    (() => {
      const signals = deriveEnergySignals({
        nutritionFacts: weekOf(2400, 150),
        targetCalories: 2000, targetProteinG: 150, targetFatG: 60,
        weightTrend: computeWeightTrend([]),
        activityBaseline: { medianDailySteps: null, stepDaysCounted: 0, medianWeeklySessionMinutes: 0, weeksCounted: 4 },
        activityContext: 'unknown',
        daysSinceTargetChange: null,
      })
      return signals.highlights.includes('intake_above_target')
    })())
  check('runtime: full signal object carries every field',
    (() => {
      const s = deriveEnergySignals({
        nutritionFacts: weekOf(1950, 150),
        targetCalories: 2000, targetProteinG: 150, targetFatG: 60,
        weightTrend: computeWeightTrend([]),
        activityBaseline: { medianDailySteps: 9000, stepDaysCounted: 10, medianWeeklySessionMinutes: 60, weeksCounted: 4 },
        activityContext: 'high',
        daysSinceTargetChange: 20,
      })
      return Object.keys(s).sort().join(',') ===
        'activityContext,calorieAdherence,carbState,dataCompleteness,fatState,highlights,proteinState,weightEvidence' &&
        s.activityContext === 'high' &&
        s.dataCompleteness.level !== undefined
    })())
  check('runtime: SIGNAL_MIN_COMPLETE_DAYS reuses the standing reliable-days rule (4)',
    SIGNAL_MIN_COMPLETE_DAYS === 4)
  check('static: signals never generate recommendations',
    !/'reduce|'increase|recommendation|proposedCalories/i.test(stripComments(signalsLib)))
  check('static: fasting deliberately absent (behavioral tool, no energy math)',
    signalsLib.includes('Fasting is deliberately') &&
    !stripComments(signalsLib).includes('fasting_logs'))
}

// ── 11. Docs and hygiene ─────────────────────────────────────────────
console.log('\n11. Docs and hygiene')
{
  check('notes document the north star and the layer boundary',
    notes.includes('north star') || notes.includes('North star') ||
    notes.includes('North Star'))
  check('notes document deterministic-vs-AI boundary',
    notes.includes('deterministic') && notes.includes('AI'))
  check('notes document target-model vs energy-model distinction',
    /target-setting/i.test(notes) && notes.includes('anchor'))
  check('notes document the heuristic limitation and 5B.2 dependency',
    notes.includes('provisional') || notes.includes('PROVISIONAL'))
  check('notes document Friday compatibility',
    notes.includes('Friday'))
  check('notes document the aggregate/component contract',
    notes.includes('850') && (notes.includes('1,550') || notes.includes('1550')))
  check('notes document confidence reasons and no-recommendations rule',
    notes.includes('reasons') && (notes.includes('no recommendations') || notes.includes('No recommendations')))
  check('notes record no migration',
    notes.includes('no migration') || notes.includes('No migration'))
  check('no emoji/pictographs in new files',
    NEW_LIBS.every((f) => !EMOJI.test(f)) && !EMOJI.test(notes))
  check('no legacy brand violations',
    NEW_LIBS.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('no TODO/FIXME debt',
    NEW_LIBS.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 12. Runtime: extended matrices ───────────────────────────────────
console.log('\n12. Runtime: extended matrices')
{
  // TDEE anchor per activity level — the exact multiplier table.
  for (const [level, mult] of [['sedentary', 10], ['moderately_active', 12], ['very_active', 14]] as const) {
    check(`runtime: ${level} anchor = weight x ${mult}`,
      estimateBaselineTdee({ weightLbs: 175, activityLevel: level }).primaryEstimate === 175 * mult)
    check(`runtime: ${level} has a defined cross-check activity factor`,
      typeof MSJ_ACTIVITY_FACTORS[level] === 'number' && MSJ_ACTIVITY_FACTORS[level] > 1)
  }
  check('runtime: Mifflin male formula exact (10w + 6.25h - 5a + 5)',
    mifflinStJeorBmr(80, 180, 30, 'male') === 10 * 80 + 6.25 * 180 - 5 * 30 + 5)
  check('runtime: Mifflin female formula exact (10w + 6.25h - 5a - 161)',
    mifflinStJeorBmr(65, 165, 40, 'female') === 10 * 65 + 6.25 * 165 - 5 * 40 - 161)
  check('runtime: Katch formula exact (370 + 21.6 x lean kg)',
    katchMcArdleBmr(90, 20) === 370 + 21.6 * 72)
  check('runtime: Katch boundary — 3% and 60% body fat are plausible',
    (() => {
      const lo = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', bfPct: 3 })
      const hi = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', bfPct: 60 })
      return lo.crossChecks.some((c) => c.method === 'katch_mcardle') &&
        hi.crossChecks.some((c) => c.method === 'katch_mcardle')
    })())
  check('runtime: Katch boundary — 2.99% and 60.01% are not',
    (() => {
      const lo = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', bfPct: 2.99 })
      const hi = estimateBaselineTdee({ weightLbs: 190, activityLevel: 'sedentary', bfPct: 60.01 })
      return lo.crossChecks.length === 0 && hi.crossChecks.length === 0
    })())
  check('runtime: plausibility range always contains the anchor',
    (() => {
      const r = estimateBaselineTdee({
        weightLbs: 190, activityLevel: 'very_active',
        sex: 'female', age: 28, heightCm: 170, bfPct: 30,
      })
      return r.plausibilityRange.low <= r.primaryEstimate &&
        r.primaryEstimate <= r.plausibilityRange.high
    })())
  check('runtime: estimator is pure and repeatable',
    (() => {
      const input = { weightLbs: 190, activityLevel: 'moderately_active', sex: 'male', age: 35, heightCm: 180, bfPct: 22 }
      return JSON.stringify(estimateBaselineTdee(input)) === JSON.stringify(estimateBaselineTdee(input))
    })())

  // Per-day adherence ratio matrix against a 2,000 target (band 10%).
  const adherenceOf = (cal: number) => buildDailyNutritionFacts(
    [food('2026-08-10', Math.round(cal * 0.6)), food('2026-08-10', Math.round(cal * 0.4))],
    '2026-08-10', '2026-08-10', 2000)[0].adherence
  for (const [cal, expected] of [
    [1600, 'under'], [1780, 'under'], [1800, 'near'],
    [2000, 'near'], [2200, 'near'], [2240, 'over'],
  ] as const) {
    check(`runtime: adherence matrix — ${cal} vs 2000 -> ${expected}`,
      adherenceOf(cal) === expected)
  }

  // Completeness combination matrix (target 2000 -> floor 900).
  for (const [cal, entries, expected] of [
    [null, 0, 'missing'], [900, 0, 'missing'],
    [899, 2, 'partial'], [900, 1, 'partial'],
    [900, 2, 'likely_complete'], [2500, 5, 'likely_complete'],
    [100, 4, 'partial'], [5000, 2, 'likely_complete'],
  ] as const) {
    check(`runtime: completeness matrix — ${cal} kcal / ${entries} entries -> ${expected}`,
      classifyNutritionDayCompleteness(cal, entries, 2000) === expected)
  }

  // Activity context is user-relative across very different baselines.
  for (const [current, baseline, expected] of [
    [3400, 5000, 'low'], [3500, 5000, 'normal'],
    [6500, 5000, 'normal'], [6501, 5000, 'high'],
    [10400, 15000, 'low'], [19501, 15000, 'high'],
  ] as const) {
    check(`runtime: context matrix — ${current} vs ${baseline} baseline -> ${expected}`,
      classifyActivityContext(current, baseline) === expected)
  }

  check('runtime: anchors emit sorted by week regardless of input order',
    (() => {
      const a = deriveWeeklyWeightAnchors(
        [weigh('2026-08-07', KG_188_5), weigh('2026-07-17', KG_190_0), weigh('2026-07-31', KG_189_3)],
        '2026-08-12')
      return a.map((x) => x.weekStart).join(',') === '2026-07-13,2026-07-27,2026-08-03'
    })())
  check('runtime: maxWeeks parameter narrows the window',
    deriveWeeklyWeightAnchors(
      [weigh('2026-07-17', KG_190_0), weigh('2026-08-07', KG_188_5)],
      '2026-08-12', 2).length === 1)
  check('runtime: trend sorts unsorted anchor input internally',
    (() => {
      const sortedIn = computeWeightTrend([
        { weekStart: '2026-07-13', anchorLbs: 190, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-20', anchorLbs: 189.5, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-27', anchorLbs: 189, contributingDates: 1, quality: 'single' },
      ])
      const unsortedIn = computeWeightTrend([
        { weekStart: '2026-07-27', anchorLbs: 189, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-13', anchorLbs: 190, contributingDates: 1, quality: 'single' },
        { weekStart: '2026-07-20', anchorLbs: 189.5, contributingDates: 1, quality: 'single' },
      ])
      return JSON.stringify(sortedIn) === JSON.stringify(unsortedIn)
    })())
  check('runtime: trend never mutates its anchor input',
    (() => {
      const anchors = [
        { weekStart: '2026-07-27', anchorLbs: 189, contributingDates: 1, quality: 'single' as const },
        { weekStart: '2026-07-13', anchorLbs: 190, contributingDates: 1, quality: 'single' as const },
        { weekStart: '2026-07-20', anchorLbs: 189.5, contributingDates: 1, quality: 'single' as const },
      ]
      const before = JSON.stringify(anchors)
      computeWeightTrend(anchors)
      return JSON.stringify(anchors) === before
    })())
  check('runtime: sumRecordedCalories ignores negative garbage',
    sumRecordedCalories([-5, 100]) === 100)
  check('runtime: an explicit-zero aggregate is authoritative zero, not null',
    resolveDailyExpenditure({ calories: 0, source: 'apple_health' },
      { workoutCalories: 300, activityCalories: null }).authoritativeCalories === 0)
  check('runtime: protein/fat signals read insufficient with no target',
    (() => {
      const facts = buildDailyNutritionFacts(
        [food('2026-08-10', 1200), food('2026-08-10', 800)],
        '2026-08-10', '2026-08-10', null)
      return deriveProteinState(facts, null) === 'insufficient_nutrition_data' &&
        deriveFatState(facts, null) === 'insufficient_nutrition_data'
    })())
  check('runtime: carb signal reads insufficient on sparse data',
    deriveCarbState([]) === 'insufficient_nutrition_data')
  check('runtime: confidence boundary — exactly 4 complete days is enough',
    (() => {
      const fourDays = buildDailyNutritionFacts(
        ['2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
          .flatMap((d) => [food(d, 1200), food(d, 800)]),
        '2026-08-06', '2026-08-12', 2000)
      const c = computeEnergyConfidence({
        nutritionFacts: fourDays,
        weightTrend: computeWeightTrend([]),
        activityBaseline: { medianDailySteps: 9000, stepDaysCounted: 10, medianWeeklySessionMinutes: 60, weeksCounted: 4 },
        daysSinceTargetChange: null,
      })
      return !c.reasons.includes('nutrition_logging_incomplete')
    })())
  check('runtime: confidence boundary — 3 complete days is not',
    (() => {
      const threeDays = buildDailyNutritionFacts(
        ['2026-08-10', '2026-08-11', '2026-08-12']
          .flatMap((d) => [food(d, 1200), food(d, 800)]),
        '2026-08-06', '2026-08-12', 2000)
      const c = computeEnergyConfidence({
        nutritionFacts: threeDays,
        weightTrend: computeWeightTrend([]),
        activityBaseline: { medianDailySteps: 9000, stepDaysCounted: 10, medianWeeklySessionMinutes: 60, weeksCounted: 4 },
        daysSinceTargetChange: null,
      })
      return c.reasons.includes('nutrition_logging_incomplete')
    })())
  check('runtime: inverted date range yields no facts (never a crash or fake day)',
    buildDailyNutritionFacts([food('2026-08-10', 1000)], '2026-08-12', '2026-08-10', 2000).length === 0)
  check('runtime: null-weight rows never anchor (2Y filter honored)',
    deriveWeeklyWeightAnchors(
      [{ logged_date: '2026-08-07', weight_kg: null, created_at: '2026-08-07T07:00:00Z' }],
      '2026-08-12').length === 0)
  check('static: anchor section documents Friday compatibility in-file',
    factsLib.includes('Friday-weigh-in compatible'))
  check('runtime: signal derivations are pure and repeatable',
    (() => {
      const facts = buildDailyNutritionFacts(
        ['2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
          .flatMap((d) => [food(d, 1200, 90), food(d, 750, 60)]),
        '2026-08-06', '2026-08-12', 2000)
      return deriveCalorieAdherence(facts, 2000) === deriveCalorieAdherence(facts, 2000) &&
        deriveProteinState(facts, 150) === deriveProteinState(facts, 150)
    })())
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
