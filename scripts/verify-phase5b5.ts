// ============================================================
// ForgeFitOS — Phase 5B.5 deterministic verification harness
// Verifies the Progress Energy & Adherence trends: weekly intake
// points from qualifying complete days only (explicit preferred,
// heuristic fallback, partial/missing excluded, gaps never zeros),
// historically-resolved weekly targets (never retroactive), weekly
// weight anchors with honest gaps and the stable regression trend,
// user-relative activity context, gated maintenance exposure, the
// deterministic interpretation copy, range controls, accessibility
// text equivalents — and the absolute boundaries: no total-burn or
// eat-back field anywhere, no data mutation from Progress, and
// unchanged 5B.3/5B.4 behavior. Aggregation runs at RUNTIME through
// the real buildProgressEnergyTrends.
// Run from the repository root:
//   npx tsx scripts/verify-phase5b5.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  buildProgressEnergyTrends,
  parseEnergyRange,
  ENERGY_RANGE_OPTIONS,
  DEFAULT_ENERGY_RANGE_WEEKS,
  WEEK_CONFIDENT_DAYS,
} from '../src/lib/progress-energy'
import type { ProgressEnergyInputs, ProgressEnergyViewModel } from '../src/lib/progress-energy'
import {
  estimateBaselineTdee,
  inferAdaptiveMaintenance,
} from '../src/lib/energy-model'
import type { AdaptiveMaintenanceEstimate } from '../src/lib/energy-model'
import { lbsToKg } from '../src/lib/units'

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

const lib = read('src/lib/progress-energy.ts')
const chart = read('src/components/progress/WeeklyEnergyChart.tsx')
const section = read('src/components/progress/EnergyTrendSection.tsx')
const page = read('src/app/(app)/progress/page.tsx')
const notes = read('docs/phase5b5-energy-trends-notes.md')

const CHANGED = [lib, chart, section, page]

// ── Fixtures ─────────────────────────────────────────────────────────
// TODAY is Tuesday 2026-08-04 → latest completed week Mon 07-27.
// An 8-week range spans Mondays 06-08 .. 07-27.
const TODAY = '2026-08-04'
const MONDAYS_8 = ['2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29',
  '2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27']
const dayOf = (monday: string, offset: number) => {
  const d = new Date(`${monday}T12:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const weigh = (date: string, lbs: number) =>
  ({ logged_date: date, weight_kg: lbsToKg(lbs), created_at: `${date}T07:00:00.000Z` })
/** N two-entry complete days (2,000 kcal) in the given week. */
const weekFood = (monday: string, days: number, calPerDay = 2000) =>
  Array.from({ length: days }, (_, i) => dayOf(monday, i)).flatMap((d) => [
    { logged_date: d, calories: Math.round(calPerDay * 0.6), protein_g: 90, carbs_g: 100, fat_g: 30 },
    { logged_date: d, calories: calPerDay - Math.round(calPerDay * 0.6), protein_g: 60, carbs_g: 80, fat_g: 20 },
  ])
const explicitDatesFor = (monday: string, days: number) =>
  Array.from({ length: days }, (_, i) => dayOf(monday, i))

function inputs(overrides: Partial<ProgressEnergyInputs> = {}): ProgressEnergyInputs {
  return {
    todayStr: TODAY,
    rangeWeeks: 8,
    goal: 'fat_loss',
    bfPct: 22,
    target: { calories: 2200, effective_date: '2026-05-01' },
    foodRows: [],
    targetHistory: [{ effective_date: '2026-05-01', calories: 2200 }],
    explicitCompleteDates: new Set<string>(),
    weighRows: [],
    stepDays: [],
    sessions: [],
    adaptive: null,
    ...overrides,
  }
}

function adaptiveOf(status: AdaptiveMaintenanceEstimate['status'], range: [number, number] | null): AdaptiveMaintenanceEstimate {
  const base = inferAdaptiveMaintenance({
    baseline: estimateBaselineTdee({ weightLbs: 200, activityLevel: 'moderately_active' }),
    weeks: [],
    daysSinceTargetChange: null,
  })
  return { ...base, status, estimatedMaintenanceRange: range }
}

// ── 1. Checkpoint and boundary ───────────────────────────────────────
console.log('\n1. Checkpoint and boundary')
{
  check('checkpoint artifacts exist (7dd8120 tree)',
    ['scripts/verify-phase5b4.ts', 'docs/phase5b4-coach-integration-notes.md',
      'src/lib/goal-adjustments.ts'].every((f) => existsSync(f)))
  check('5B.5 notes exist', notes.length > 2500)
  // RETARGET (UI-3): 020 is that approved phase's dashboard-prefs
  // migration — the boundary (no UNEXPECTED migration) survives as
  // "exactly 20, and the single addition is the named UI-3 file".
  // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
  check('migration boundary: exactly 22 (021 = UI-5B1B ordering; 022 = UI-5B2 reuse)',
    // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
    // workout-reuse migration (create_routine_from_workout +
    // repeat_workout). The boundary moves from exactly-21 to
    // exactly-22; no other migration may appear.
    (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-2F migration 026 apply-prep candidate): 026_exlib_plank_seed_reconciliation.sql is the reviewed apply-prep candidate prepared by EXLIB-2F (PREPARED, NOT APPLIED; its executable SQL is byte-identical to the promoted EXLIB-2E proposal sha256 a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108, candidate file sha256 620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc); the boundary moves from exactly-25 to exactly-26; 023/024/025/026 all stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-2M migration-027 apply-prep): 027_exlib_catalog_content_schema.sql is the reviewed apply-prep candidate prepared by EXLIB-2M (PREPARED, NOT APPLIED; its executable SQL is byte-identical to the promoted EXLIB-2L proposal sha256 9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553, candidate file sha256 90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f); the boundary moves from exactly-26 to exactly-27; 023/024/025/026/027 all stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 27 && readdirSync('supabase/migrations').some((f) => f === '026_exlib_plank_seed_reconciliation.sql') && readdirSync('supabase/migrations').some((f) => f === '027_exlib_catalog_content_schema.sql') && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('020')).length === 1 &&
    readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
  check('exactly 4 feature files carry 5B.5 markers',
    ['src/lib/progress-energy.ts', 'src/components/progress/WeeklyEnergyChart.tsx',
      'src/components/progress/EnergyTrendSection.tsx', 'src/app/(app)/progress/page.tsx']
      .every((f) => read(f).includes('5B.5')))
  check('no new chart dependency (plain SVG per the 2W precedent)',
    !read('package.json').includes('recharts') && !read('package.json').includes('"d3') &&
    chart.includes('<svg'))
  check('S35: no Progress action mutates data (read-only everywhere)',
    CHANGED.every((f) =>
      !/\.(insert|update|upsert|delete)\(/.test(stripComments(f))))
  check('no decision_logs / target writes in scope',
    CHANGED.every((f) => !stripComments(f).includes('decision_logs')))
  check('server components only (no client JS added)',
    !chart.includes("'use client'") && !section.includes("'use client'"))
}

// ── 2. Runtime: weekly intake evidence (scenarios 1–7) ───────────────
console.log('\n2. Runtime: weekly intake evidence')
{
  const W = MONDAYS_8[7] // 07-27, latest completed week
  check('S1: explicitly completed days enter weekly averages',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(W, 5),
        explicitCompleteDates: new Set(explicitDatesFor(W, 5)),
      }))
      const wk = m.intakeWeeks[7]
      return wk.averageIntakeCalories === 2000 && wk.explicitDays === 5 && wk.qualifyingDays === 5
    })())
  check('S2: heuristic-complete days act only as fallback (counted separately)',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 5) }))
      const wk = m.intakeWeeks[7]
      return wk.averageIntakeCalories === 2000 && wk.explicitDays === 0 && wk.heuristicDays === 5
    })())
  check('S3: partial days do not enter weekly averages',
    (() => {
      // 4 complete days at 2,000 + 2 tiny single-entry (partial) days:
      // the average must stay exactly 2,000.
      const m = buildProgressEnergyTrends(inputs({
        foodRows: [
          ...weekFood(W, 4),
          { logged_date: dayOf(W, 4), calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10 },
          { logged_date: dayOf(W, 5), calories: 250, protein_g: 15, carbs_g: 25, fat_g: 8 },
        ],
      }))
      const wk = m.intakeWeeks[7]
      return wk.averageIntakeCalories === 2000 && wk.qualifyingDays === 4
    })())
  check('S4: missing days do not become zero intake',
    (() => {
      // 5 complete days: the average is 2,000 — never 2000*5/7.
      const m = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 5) }))
      return m.intakeWeeks[7].averageIntakeCalories === 2000
    })())
  check('S5: weeks with no qualifying intake remain gaps (null, not a point)',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 5) }))
      return m.intakeWeeks[6].averageIntakeCalories === null && m.intakeWeeks[0].averageIntakeCalories === null &&
        m.intakeWeeks.length === 8
    })())
  check('S6: weekly points disclose qualifying-day counts',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(W, 3),
      }))
      const wk = m.intakeWeeks[7]
      return wk.qualifyingDays === 3 && typeof wk.explicitDays === 'number' &&
        typeof wk.heuristicDays === 'number'
    })())
  check('S7: sparse weeks (1-3 days) marked low confidence, never equal-reliability',
    (() => {
      const sparse = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 3) }))
      const full = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 5) }))
      return sparse.intakeWeeks[7].lowConfidence === true &&
        full.intakeWeeks[7].lowConfidence === false &&
        WEEK_CONFIDENT_DAYS === 4
    })())
}

// ── 3. Runtime: historical targets (scenarios 8–10) ──────────────────
// RETARGETED (5B.5 target-audit correction): these fixtures have no
// qualifying intake, so they were always exercising the target-HISTORY
// timeline, not an intake comparison. The old `targetCalories` field
// (week-end resolution presented as the week's comparison target) was
// the audited defect; the surviving structural claims — resolution by
// effective_date, change lands on the correct week, never retroactive,
// never guessed — now pin the explicit `activeTargetAtWeekEnd`
// timeline field, and the comparison target is proven separately in
// section 3b against qualifying days.
console.log('\n3. Runtime: historical target resolution (timeline)')
{
  const history = [
    { effective_date: '2026-07-15', calories: 2000 }, // mid-range change
    { effective_date: '2026-05-01', calories: 2200 },
  ]
  const m = buildProgressEnergyTrends(inputs({ targetHistory: history }))
  check('S8: target-history timeline resolves by effective date',
    m.intakeWeeks[0].activeTargetAtWeekEnd === 2200 && // week of 06-08
    m.intakeWeeks[7].activeTargetAtWeekEnd === 2000)   // week of 07-27
  check('S9: a mid-range change appears on the timeline at the correct week',
    (() => {
      // 07-15 (Wednesday) falls in the week of 07-13: that week's END
      // (07-19) resolves the NEW version; the prior week keeps the old.
      const wk0713 = m.intakeWeeks[5]
      const wk0706 = m.intakeWeeks[4]
      return wk0713.weekStart === '2026-07-13' && wk0713.activeTargetAtWeekEnd === 2000 &&
        wk0706.activeTargetAtWeekEnd === 2200
    })())
  check('S10: timeline changes are never applied retroactively',
    m.intakeWeeks.slice(0, 5).every((w) => w.activeTargetAtWeekEnd === 2200))
  check('S10b: no target history -> null everywhere, never a guess',
    (() => {
      const none = buildProgressEnergyTrends(inputs({ targetHistory: [] }))
      return none.intakeWeeks.every(
        (w) => w.activeTargetAtWeekEnd === null && w.averageTargetCalories === null)
    })())
  check('S10c: no-intake weeks expose NO comparison target (timeline only)',
    m.intakeWeeks.every((w) => w.averageTargetCalories === null &&
      w.activeTargetAtWeekEnd !== null))
}

// ── 3b. Correction audit: mixed-target weeks (T1–T20) ────────────────
console.log('\n3b. Correction audit: per-date intake-comparison targets')
{
  const W = MONDAYS_8[7] // 2026-07-27
  // Target 2,300 through Wednesday 07-29; 2,100 effective Thursday
  // 07-30. Qualifying days Mon, Tue (old era) + Thu, Fri, Sat (new
  // era), all at 2,350 intake.
  const mixedHistory = [
    { effective_date: '2026-07-30', calories: 2100 },
    { effective_date: '2026-05-01', calories: 2300 },
  ]
  const mixedFood = [0, 1, 3, 4, 5].flatMap((o) => [
    { logged_date: dayOf(W, o), calories: 1400, protein_g: 90, carbs_g: 100, fat_g: 30 },
    { logged_date: dayOf(W, o), calories: 950, protein_g: 60, carbs_g: 80, fat_g: 20 },
  ])
  const mixedExplicit = new Set([0, 1, 3, 4, 5].map((o) => dayOf(W, o)))
  const mixed = buildProgressEnergyTrends(inputs({
    foodRows: mixedFood, targetHistory: mixedHistory, explicitCompleteDates: mixedExplicit,
  }))
  const mixedWk = mixed.intakeWeeks[7]

  check('T1: single-version week -> comparison target IS that version',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(W, 5),
        explicitCompleteDates: new Set(explicitDatesFor(W, 5)),
      }))
      const wk = m.intakeWeeks[7]
      return wk.averageTargetCalories === 2200 && wk.targetVersionCount === 1 &&
        wk.hasTargetTransition === false && wk.targetTransition === null
    })())
  check('T2: mixed week resolves EVERY qualifying day by its own date',
    // 2 days at 2,300 + 3 days at 2,100 -> (2*2300 + 3*2100)/5 = 2,180
    mixedWk.averageIntakeCalories === 2350 && mixedWk.averageTargetCalories === 2180)
  check('T3: weekly target weighted by the SAME qualifying days as intake',
    // 2,180 — NOT the unweighted version mean (2300+2100)/2 = 2,200.
    mixedWk.qualifyingDays === 5 && mixedWk.averageTargetCalories === 2180)
  check('T4: non-qualifying days never enter the comparison-target average',
    (() => {
      // Add a partial (single tiny entry) day in the OLD era: if it
      // leaked into the target average, 2,180 would drift toward 2,300.
      const m = buildProgressEnergyTrends(inputs({
        foodRows: [...mixedFood,
          { logged_date: dayOf(W, 2), calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10 }],
        targetHistory: mixedHistory, explicitCompleteDates: mixedExplicit,
      }))
      return m.intakeWeeks[7].averageTargetCalories === 2180
    })())
  check('T5: partial days influence neither intake nor target averages',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: [...mixedFood,
          { logged_date: dayOf(W, 2), calories: 300, protein_g: 20, carbs_g: 30, fat_g: 10 }],
        targetHistory: mixedHistory, explicitCompleteDates: mixedExplicit,
      }))
      const wk = m.intakeWeeks[7]
      return wk.averageIntakeCalories === 2350 && wk.averageTargetCalories === 2180 &&
        wk.qualifyingDays === 5
    })())
  check('T6: missing days influence neither average (5 days, never /7)',
    mixedWk.averageIntakeCalories === 2350 && mixedWk.averageTargetCalories === 2180)
  check('T7: a change is not applied to qualifying days BEFORE its effective date',
    (() => {
      // Week fully before a 07-01 change keeps the old target.
      const m = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(MONDAYS_8[2], 5), // week of 06-22
        targetHistory: [
          { effective_date: '2026-07-01', calories: 2100 },
          { effective_date: '2026-05-01', calories: 2300 },
        ],
      }))
      return m.intakeWeeks[2].averageTargetCalories === 2300
    })())
  check('T8: the OLD target is not applied after the new effective date',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(MONDAYS_8[4], 5), // week of 07-06, fully after
        targetHistory: [
          { effective_date: '2026-07-01', calories: 2100 },
          { effective_date: '2026-05-01', calories: 2300 },
        ],
      }))
      return m.intakeWeeks[4].averageTargetCalories === 2100
    })())
  check('T9: a mixed-target week is flagged as a transition week',
    mixedWk.hasTargetTransition === true &&
    mixed.intakeWeeks.filter((w) => w.hasTargetTransition).length === 1)
  check('T10: target-version count is correct (2 mixed, 1 pure, 0 empty)',
    mixedWk.targetVersionCount === 2 &&
    mixed.intakeWeeks[6].targetVersionCount === 0 &&
    (() => {
      const pure = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 5) }))
      return pure.intakeWeeks[7].targetVersionCount === 1
    })())
  check('T11: accessible text discloses the old/new transition',
    mixedWk.targetTransition !== null &&
    mixedWk.targetTransition!.fromCalories === 2300 &&
    mixedWk.targetTransition!.toCalories === 2100 &&
    section.includes('target changed from ') &&
    section.includes('day-weighted average'))
  check('T12: legend distinguishes a weekly average target + transition marker',
    section.includes("'Dashed: target (day-weighted average when it changed mid-week)'") &&
    section.includes("'Diamond: mid-week target change'") &&
    chart.includes('targetTransition') &&
    !section.includes("'Dashed: active target'"))
  check('T13: adherence classification uses the matched averages',
    // 2,350 vs weighted 2,180 = 7.8% -> Near target; vs the week-end
    // 2,100 it would have been 11.9% -> the old, wrong "Above target".
    mixed.summary.calorieAdherence === 'Near target' &&
    (() => {
      const pureNew = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(W, 5, 2350),
        targetHistory: [{ effective_date: '2026-05-01', calories: 2100 }],
      }))
      return pureNew.summary.calorieAdherence === 'Above target'
    })())
  check('T14: summary/interpretation copy never compares the wrong target',
    // With the week-end 2,100 this fixture used to read "above target";
    // against the honest 2,180 day-weighted average it is near target.
    mixed.interpretation.some((l) => l.includes('near target')) &&
    !mixed.interpretation.some((l) => l.includes('above target')))
  check('T14b: adherence math references only the matched averages in code',
    (() => {
      const adherenceBlock = stripComments(lib).split('calorieAdherence')[1] ?? ''
      return adherenceBlock.includes('averageTargetCalories') &&
        !adherenceBlock.slice(0, 600).includes('activeTargetAtWeekEnd')
    })())
  check('T15: a week with no qualifying intake fabricates NO comparison target',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ targetHistory: mixedHistory }))
      return m.intakeWeeks.every((w) => w.averageTargetCalories === null) &&
        m.intakeWeeks[7].activeTargetAtWeekEnd === 2100
    })())
  check('T15b: qualifying days predating the first target version -> comparison withheld',
    (() => {
      // An explicitly completed day BEFORE any target existed has no
      // historically correct target — the comparison average must be
      // withheld (null), never patched with the week-end version. The
      // chart falls back to the timeline only on no-intake weeks.
      const m = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(W, 2),
        explicitCompleteDates: new Set(explicitDatesFor(W, 2)),
        targetHistory: [{ effective_date: dayOf(W, 4), calories: 2100 }],
      }))
      const wk = m.intakeWeeks[7]
      return wk.averageIntakeCalories === 2000 && wk.averageTargetCalories === null &&
        wk.activeTargetAtWeekEnd === 2100 &&
        section.includes('w.averageIntakeCalories === null ? w.activeTargetAtWeekEnd : null')
    })())
  check('T16: the target-history timeline preserves the effective-date change',
    mixed.intakeWeeks[6].activeTargetAtWeekEnd === 2300 && // week of 07-20
    mixed.intakeWeeks[7].activeTargetAtWeekEnd === 2100)   // change inside 07-27 week
  check('T17: Sunday/Monday boundary — Monday-effective change splits correctly',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: [
          // Sunday 07-26 (week of 07-20) and Monday 07-27 (week of 07-27)
          { logged_date: '2026-07-26', calories: 1400, protein_g: 90, carbs_g: 100, fat_g: 30 },
          { logged_date: '2026-07-26', calories: 800, protein_g: 60, carbs_g: 80, fat_g: 20 },
          { logged_date: '2026-07-27', calories: 1400, protein_g: 90, carbs_g: 100, fat_g: 30 },
          { logged_date: '2026-07-27', calories: 800, protein_g: 60, carbs_g: 80, fat_g: 20 },
        ],
        targetHistory: [
          { effective_date: '2026-07-27', calories: 2100 }, // effective ON Monday
          { effective_date: '2026-05-01', calories: 2300 },
        ],
      }))
      return m.intakeWeeks[6].averageTargetCalories === 2300 &&
        m.intakeWeeks[7].averageTargetCalories === 2100 &&
        !m.intakeWeeks[6].hasTargetTransition && !m.intakeWeeks[7].hasTargetTransition
    })())
  check('T18: range changes never alter historical target resolution',
    (() => {
      const four = buildProgressEnergyTrends(inputs({
        rangeWeeks: 4, foodRows: mixedFood, targetHistory: mixedHistory,
        explicitCompleteDates: mixedExplicit,
      }))
      const twelve = buildProgressEnergyTrends(inputs({
        rangeWeeks: 12, foodRows: mixedFood, targetHistory: mixedHistory,
        explicitCompleteDates: mixedExplicit,
      }))
      return four.intakeWeeks[3].averageTargetCalories === 2180 &&
        twelve.intakeWeeks[11].averageTargetCalories === 2180 &&
        four.intakeWeeks[3].hasTargetTransition && twelve.intakeWeeks[11].hasTargetTransition
    })())
  check('T19: 5B.4 Coach thresholds and target behavior remain untouched',
    (() => {
      const coach = read('src/lib/goal-adjustments.ts')
      return coach.includes('MIN_COMPLETE_DAYS_FOR_PROPOSAL = 5') &&
        coach.includes('MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT = 3') &&
        !coach.includes('averageTargetCalories') && !coach.includes('5B.5')
    })())
  check('T20: the correction introduces no burn/eat-back arithmetic',
    (() => {
      const json = JSON.stringify(mixed)
      return !json.includes('burn') && !json.includes('earned') &&
        !json.includes('expenditure') &&
        CHANGED.every((f) => !stripComments(f).includes('calories_burned'))
    })())
}

// ── 4. Runtime: weekly weight anchors (scenarios 11–17) ──────────────
console.log('\n4. Runtime: weight anchors and trend')
{
  const fridays = (lbs: number[]) =>
    MONDAYS_8.slice(-lbs.length).map((m, i) => weigh(dayOf(m, 4), lbs[i]))
  check('S11: one Friday weigh-in produces a valid single-quality anchor',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ weighRows: fridays([200]) }))
      return m.weightAnchors.length === 1 && m.weightAnchors[0].quality === 'single' &&
        m.weightAnchors[0].contributingDates === 1
    })())
  check('S12: multiple weekly readings produce an averaged stronger anchor',
    (() => {
      const W = MONDAYS_8[7]
      const m = buildProgressEnergyTrends(inputs({
        weighRows: [weigh(dayOf(W, 1), 201), weigh(dayOf(W, 4), 199)],
      }))
      return m.weightAnchors.length === 1 && m.weightAnchors[0].quality === 'multi' &&
        m.weightAnchors[0].anchorLbs === 200
    })())
  check('S13: missing weight weeks remain gaps (anchors list only anchored weeks)',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        weighRows: [weigh(dayOf(MONDAYS_8[0], 4), 202), weigh(dayOf(MONDAYS_8[7], 4), 200)],
      }))
      return m.weightAnchors.length === 2 && m.intakeWeeks.length === 8
    })())
  check('S14: actual week spacing preserved (7-week gap -> rate uses real spacing)',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        weighRows: [
          weigh(dayOf(MONDAYS_8[0], 4), 203.5),
          weigh(dayOf(MONDAYS_8[4], 4), 201.5),
          weigh(dayOf(MONDAYS_8[7], 4), 200),
        ],
      }))
      // 3.5 lbs over 7 weeks = -0.5/wk exactly.
      return m.weightTrend.weeklyRateLb === -0.5
    })())
  check('S15: trend withheld when evidence is insufficient (< 3 anchors)',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ weighRows: fridays([200.5, 200]) }))
      return m.weightTrend.weeklyRateLb === null &&
        m.weightTrend.trendDirection === 'insufficient_data' &&
        m.summary.weightTrajectory === 'Not enough weigh-ins yet'
    })())
  check('S16: weight trend uses the stable regression implementation',
    lib.includes('computeWeightTrend(anchors)') &&
    !lib.includes('function computeWeightTrend'))
  check('S17: goal-rate bands use the existing stable rules (classifyTrajectory)',
    lib.includes("import { classifyTrajectory } from '@/lib/today-energy'") &&
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        weighRows: fridays([201.8, 201.2, 200.6, 200]), // -0.3%/wk: slower than band
      }))
      return m.trajectory.state === 'watching'
    })())
  check('S17b: on-track classification flows through',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        weighRows: fridays([204.5, 203, 201.5, 200]), // ~-0.75%/wk inside 0.5-1.25 (bf 22)
      }))
      return m.trajectory.state === 'on_track'
    })())
}

// ── 5. Runtime: activity context (scenarios 18–20) ───────────────────
console.log('\n5. Runtime: activity context')
{
  const stepDaysFor = (mondays: string[], steps: number) =>
    mondays.flatMap((m) => Array.from({ length: 7 }, (_, i) =>
      ({ logged_date: dayOf(m, i), steps })))
  check('S18: missing activity stays unknown, never low',
    (() => {
      const m = buildProgressEnergyTrends(inputs())
      return m.activity.context === 'unknown' &&
        m.summary.activity === 'Not enough history'
    })())
  check('S19: activity is relative to the user baseline',
    (() => {
      // Baseline weeks at 10k, latest week at 6k -> low for THIS user.
      const rows = [
        ...stepDaysFor(['2026-07-06', '2026-07-13', '2026-07-20'], 10000),
        ...stepDaysFor(['2026-07-27'], 6000),
      ]
      const m = buildProgressEnergyTrends(inputs({ stepDays: rows }))
      return m.activity.context === 'low' &&
        m.summary.activity === 'Below your usual level'
    })())
  check('S19b: the same absolute steps read differently for a lower baseline',
    (() => {
      const rows = [
        ...stepDaysFor(['2026-07-06', '2026-07-13', '2026-07-20'], 4000),
        ...stepDaysFor(['2026-07-27'], 6000),
      ]
      const m = buildProgressEnergyTrends(inputs({ stepDays: rows }))
      return m.activity.context === 'high'
    })())
  check('S20: activity never alters intake or target values',
    (() => {
      const W = MONDAYS_8[7]
      const withActivity = buildProgressEnergyTrends(inputs({
        foodRows: weekFood(W, 5),
        stepDays: stepDaysFor(['2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27'], 12000),
      }))
      const without = buildProgressEnergyTrends(inputs({ foodRows: weekFood(W, 5) }))
      return withActivity.intakeWeeks[7].averageIntakeCalories === without.intakeWeeks[7].averageIntakeCalories &&
        withActivity.intakeWeeks[7].averageTargetCalories === without.intakeWeeks[7].averageTargetCalories
    })())
}

// ── 6. Energy non-negotiables (scenarios 21–22) ──────────────────────
console.log('\n6. Energy non-negotiables')
{
  check('S21: workout/session calories never enter chart energy math',
    lib.includes(".select('workout_date, completed_duration_seconds')") &&
    lib.includes(".select('activity_date, duration_seconds')") &&
    CHANGED.every((f) => !stripComments(f).includes('calories_burned')))
  check('S22: no total-burn or eat-back field exists in the view model',
    !lib.includes('totalBurn') && !lib.includes('caloriesBurned') &&
    !lib.includes('expenditure') &&
    CHANGED.every((f) =>
      !/eat.?back|earned (food|calories)|remaining after exercise|target \+ .*burn/i
        .test(stripComments(f))))
  check('S22b: no steps/distance-to-calorie conversion',
    CHANGED.every((f) => !/stepsToCalories|caloriesFromSteps|distanceToCalories/i
      .test(stripComments(f))))
}

// ── 7. Runtime: maintenance gating (scenarios 23–26) ─────────────────
console.log('\n7. Runtime: maintenance gating')
{
  check('S23: high confidence exposes a bounded RANGE',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ adaptive: adaptiveOf('high_confidence', [2400, 2600]) }))
      return m.maintenance.range !== null &&
        m.maintenance.range[0] === 2400 && m.maintenance.range[1] === 2600 &&
        m.summary.maintenance === '2,400–2,600 kcal/day' &&
        m.maintenance.note.includes('2,400–2,600')
    })())
  check('S24: moderate confidence exposes NO numeric range',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ adaptive: adaptiveOf('moderate_confidence', [2400, 2600]) }))
      return m.maintenance.range === null &&
        m.summary.maintenance === 'Still settling' &&
        !/\d/.test(m.maintenance.note)
    })())
  check('S25: low/insufficient confidence exposes NO numeric value',
    (() => {
      const m = buildProgressEnergyTrends(inputs({ adaptive: adaptiveOf('insufficient_data', null) }))
      const none = buildProgressEnergyTrends(inputs())
      return m.maintenance.range === null && none.maintenance.range === null &&
        !/\d/.test(none.maintenance.note)
    })())
  check('S26: confidence copy is plain language, never raw reason codes',
    (() => {
      const m = buildProgressEnergyTrends(inputs())
      const text = JSON.stringify(m.summary) + m.interpretation.join(' ') + m.maintenance.note
      return !/insufficient_weight_anchors|nutrition_logging_incomplete|high_confidence|explicit_complete/
        .test(text)
    })())
  check('no historical maintenance series exists (leakage-safe current summary only)',
    !lib.includes('maintenanceHistory') && !lib.includes('maintenanceSeries') &&
    lib.includes('no historical'))
}

// ── 8. Runtime: ranges and empty states (scenarios 27–30) ────────────
console.log('\n8. Runtime: ranges and empty states')
{
  check('S27: 4/8/12-week ranges produce correctly bounded output',
    (() => {
      const four = buildProgressEnergyTrends(inputs({ rangeWeeks: 4 }))
      const eight = buildProgressEnergyTrends(inputs({ rangeWeeks: 8 }))
      const twelve = buildProgressEnergyTrends(inputs({ rangeWeeks: 12 }))
      return four.intakeWeeks.length === 4 && eight.intakeWeeks.length === 8 &&
        twelve.intakeWeeks.length === 12 &&
        four.intakeWeeks[3].weekStart === '2026-07-27' &&
        twelve.intakeWeeks[11].weekStart === '2026-07-27' &&
        four.intakeWeeks[0].weekStart === '2026-07-06' &&
        twelve.intakeWeeks[0].weekStart === '2026-05-11'
    })())
  check('S27b: parseEnergyRange accepts only supported ranges, defaults 8',
    parseEnergyRange('4') === 4 && parseEnergyRange('8') === 8 &&
    parseEnergyRange('12') === 12 && parseEnergyRange('6') === 8 &&
    parseEnergyRange('abc') === 8 && parseEnergyRange(undefined) === 8 &&
    parseEnergyRange(['12']) === 12 &&
    DEFAULT_ENERGY_RANGE_WEEKS === 8 && ENERGY_RANGE_OPTIONS.length === 3)
  check('S27c: range changes never alter evidence semantics',
    (() => {
      const W = MONDAYS_8[7]
      const four = buildProgressEnergyTrends(inputs({ rangeWeeks: 4, foodRows: weekFood(W, 5) }))
      const twelve = buildProgressEnergyTrends(inputs({ rangeWeeks: 12, foodRows: weekFood(W, 5) }))
      return four.intakeWeeks[3].averageIntakeCalories === twelve.intakeWeeks[11].averageIntakeCalories &&
        four.intakeWeeks[3].qualifyingDays === twelve.intakeWeeks[11].qualifyingDays
    })())
  check('S28: empty datasets render a useful honest state',
    (() => {
      const m = buildProgressEnergyTrends(inputs())
      return m.intakeWeeks.every((w) => w.averageIntakeCalories === null) &&
        m.weightAnchors.length === 0 &&
        m.summary.calorieAdherence === 'Not enough completed days' &&
        m.summary.weightTrajectory === 'Not enough weigh-ins yet' &&
        m.interpretation.some((l) => l.includes('not treating the apparent intake average as confirmed under-eating'))
    })())
  check('S29: null and zero remain distinct (explicit 0-step days count in averages)',
    (() => {
      const rows = [
        ...['2026-07-06', '2026-07-13', '2026-07-20'].flatMap((m) =>
          Array.from({ length: 7 }, (_, i) => ({ logged_date: dayOf(m, i), steps: 10000 }))),
        ...Array.from({ length: 6 }, (_, i) => ({ logged_date: dayOf('2026-07-27', i), steps: 10000 })),
        { logged_date: dayOf('2026-07-27', 6), steps: 0 }, // explicit rest day
      ]
      const withZero = buildProgressEnergyTrends(inputs({ stepDays: rows }))
      const withNull = buildProgressEnergyTrends(inputs({
        stepDays: rows.map((r) => r.steps === 0 ? { ...r, steps: null } : r),
      }))
      // The explicit zero lowers the recent average; the null does not.
      return (withZero.activity.recentWeekAvgSteps as number) <
        (withNull.activity.recentWeekAvgSteps as number)
    })())
  check('S30: week boundaries assigned consistently (Monday ISO weeks, local dates)',
    (() => {
      const m = buildProgressEnergyTrends(inputs({
        foodRows: [
          // Sunday 07-26 belongs to the week of 07-20, Monday 07-27 to 07-27.
          { logged_date: '2026-07-26', calories: 1200, protein_g: 90, carbs_g: 100, fat_g: 30 },
          { logged_date: '2026-07-26', calories: 800, protein_g: 60, carbs_g: 80, fat_g: 20 },
          { logged_date: '2026-07-27', calories: 1300, protein_g: 90, carbs_g: 100, fat_g: 30 },
          { logged_date: '2026-07-27', calories: 800, protein_g: 60, carbs_g: 80, fat_g: 20 },
        ],
      }))
      return m.intakeWeeks[6].qualifyingDays === 1 && m.intakeWeeks[6].averageIntakeCalories === 2000 &&
        m.intakeWeeks[7].qualifyingDays === 1 && m.intakeWeeks[7].averageIntakeCalories === 2100
    })())
}

// ── 9. UI, accessibility, and regression (scenarios 31–35) ───────────
console.log('\n9. UI, accessibility, regression')
{
  check('S31: chart labels stay bounded on mobile (sparse labeling + viewBox scaling)',
    chart.includes('labelEvery') && chart.includes('viewBox') &&
    chart.includes('className="w-full h-auto"') &&
    !chart.includes('window.innerWidth'))
  check('S32: every chart value has an accessible text equivalent',
    chart.includes('<ul className="sr-only">') &&
    chart.includes('role="img"') && chart.includes('aria-label=') &&
    chart.includes('<title>{s.detail}</title>'))
  check('S32b: meaning never carried by color alone (hollow/solid + text)',
    section.includes("'Solid: 4+ completed days'") &&
    section.includes("'Hollow: single weigh-in'") &&
    chart.includes('s.hollow'))
  check('S33: 5B.3 Today energy behavior unchanged',
    !read('src/lib/today-energy.ts').includes('5B.5') &&
    !read('src/components/dashboard/EnergyBalanceCard.tsx').includes('5B.5') &&
    lib.includes("import { classifyTrajectory } from '@/lib/today-energy'"))
  check('S34: 5B.4 Coach decision behavior unchanged',
    !read('src/lib/goal-adjustments.ts').includes('5B.5') &&
    !read('src/app/api/goal-adjustment/route.ts').includes('5B.5') &&
    !section.includes('proposedCalories'))
  check('interpretation defers decisions to the Coach review (no new engine)',
    lib.includes('the adjustment review on the Nutrition page weighs whether a change is warranted') &&
    !lib.includes('reduce your calories') && !lib.includes('increase your calories'))
  check('range controls are plain links preserving the mode filter',
    section.includes('/progress?range=${weeks}') &&
    section.includes('modeParam ? `&mode=${modeParam}` : '))
  check('summary strip renders the five required rows',
    ['Weight trajectory', 'Calorie adherence', 'Logging coverage', 'Activity', 'Maintenance']
      .every((label) => section.includes(`'${label}'`)))
  check('coverage table uses neutral language',
    section.includes('more completed days needed') &&
    section.includes('strong coverage') &&
    !section.toLowerCase().includes('shame') && !section.includes('failed to log'))
  check('professional lucide icon, no emoji anywhere',
    section.includes("import { Gauge } from 'lucide-react'") &&
    CHANGED.every((f) => !EMOJI.test(f)))
  check('page mounts the section after the existing grids (additive)',
    page.includes('<EnergyTrendSection') &&
    page.indexOf('<EnergyTrendSection') > page.indexOf('Nutrition details'))
  // RETARGET (LOCAL-DATE-FIX): original boundary — the fetch was
  // anchored at `todayISO()` (server UTC day). Argument order and the
  // parallel-batch placement are unchanged; the anchor is now the
  // cookie-resolved user-local day.
  check('page fetch runs in the existing parallel batch',
    page.includes('fetchProgressEnergyTrends(supabase, user.id, localToday, energyRange, target, profile)'))
  check('runtime: builder is pure and repeatable',
    (() => {
      const a = buildProgressEnergyTrends(inputs({ foodRows: weekFood(MONDAYS_8[7], 5) }))
      const b = buildProgressEnergyTrends(inputs({ foodRows: weekFood(MONDAYS_8[7], 5) }))
      return JSON.stringify(a) === JSON.stringify(b)
    })())
  check('runtime: view model carries no forbidden fields',
    (() => {
      const m = buildProgressEnergyTrends(inputs())
      const json = JSON.stringify(m)
      return !json.includes('burn') && !json.includes('earned') &&
        !json.includes('expenditure')
    })())
}

// ── 10. Range-control scroll-preservation correction (RC1–RC15) ──────
// Root cause: the range controls already used next/link (client-side
// soft navigation, never a full reload) but omitted scroll={false},
// so the App Router's default post-navigation behavior scrolled the
// viewport to the top after the RSC payload for the new ?range= swapped
// in. Fix is exactly `scroll={false}` on the existing Link — no client
// component, no router/useTransition, no manual scroll math.
console.log('\n10. Range-control scroll-preservation correction')
{
  const linkBlockMatch = section.match(/<Link[\s\S]*?\/>|<Link[\s\S]*?>[\s\S]*?<\/Link>/)
  const linkBlock = linkBlockMatch ? linkBlockMatch[0] : ''

  check('RC1: range controls use next/link, not a full-reload mechanism',
    section.includes("import Link from 'next/link'") &&
    linkBlock.length > 0 &&
    !stripComments(section).includes('window.location') &&
    !stripComments(section).includes('<a href') &&
    !stripComments(section).includes('<form'))
  check('RC2: navigation explicitly preserves scroll (scroll={false})',
    linkBlock.includes('scroll={false}'))
  check('RC3/4/5: selecting 4/8/12 updates the range param correctly',
    (() => {
      // rangeHref is a private closure; reconstruct it from the pinned
      // template exactly as written, then prove it against the live
      // ENERGY_RANGE_OPTIONS values (4, 8, 12) — not hardcoded guesses.
      const rangeHref = (weeks: number, modeParam: string | null) =>
        `/progress?range=${weeks}${modeParam ? `&mode=${modeParam}` : ''}`
      return ENERGY_RANGE_OPTIONS.every((w) => rangeHref(w, null) === `/progress?range=${w}`) &&
        section.includes('`/progress?range=${weeks}${modeParam') &&
        JSON.stringify(ENERGY_RANGE_OPTIONS) === JSON.stringify([4, 8, 12])
    })())
  check('RC6: existing mode param is preserved across a range change',
    (() => {
      const rangeHref = (weeks: number, modeParam: string | null) =>
        `/progress?range=${weeks}${modeParam ? `&mode=${modeParam}` : ''}`
      return rangeHref(8, 'bodyweight') === '/progress?range=8&mode=bodyweight' &&
        rangeHref(4, 'bodyweight') === '/progress?range=4&mode=bodyweight'
    })())
  check('RC7: no other query params exist on /progress to lose (verified surface)',
    // The page's searchParams contract is exactly {mode, range} — mode
    // is the only other param today, and RC6 proves it survives a
    // range change. Pinned so a future third param is caught here.
    /searchParams\?:\s*\{\s*mode\?:\s*string \| string\[\]; range\?:\s*string \| string\[\]\s*\}/
      .test(stripComments(page)))
  check('RC8: direct range URLs remain supported (?range=4|8|12)',
    parseEnergyRange('4') === 4 && parseEnergyRange('8') === 8 && parseEnergyRange('12') === 12)
  check('RC9: invalid range values keep the existing safe fallback (default 8)',
    parseEnergyRange('6') === 8 && parseEnergyRange('abc') === 8 &&
    parseEnergyRange(undefined) === 8 && parseEnergyRange('') === 8)
  check('RC10: selected range exposes aria-current (not color alone)',
    linkBlock.includes("aria-current={model.rangeWeeks === weeks ? 'true' : undefined}") &&
    linkBlock.includes('className={cn('))
  check('RC11: no viewport-measurement or manual scroll-restoration hack added',
    !stripComments(section).includes('window.scrollY') &&
    !stripComments(section).includes('scrollIntoView') &&
    !stripComments(section).includes('getBoundingClientRect') &&
    !stripComments(section).includes('setTimeout') &&
    !stripComments(section).includes("'use client'") &&
    !stripComments(section).includes('useRouter') &&
    !stripComments(section).includes('useTransition'))
  // RETARGET (LOCAL-DATE-FIX): original boundary — the fetch anchored
  // at todayISO() (server UTC day). The range still comes exclusively
  // from the server-parsed ?range; only the anchor day moved to the
  // cookie-resolved user-local day.
  check('RC12: Progress data still uses the selected server-derived range',
    page.includes('const energyRange = parseEnergyRange(searchParams?.range)') &&
    page.includes('fetchProgressEnergyTrends(supabase, user.id, localToday, energyRange, target, profile)'))
  check('RC13: historical-target behavior is unchanged by this correction',
    (() => {
      const W = MONDAYS_8[7]
      const mixedHistory = [
        { effective_date: '2026-07-30', calories: 2100 },
        { effective_date: '2026-05-01', calories: 2300 },
      ]
      const mixedFood = [0, 1, 3, 4, 5].flatMap((o) => [
        { logged_date: dayOf(W, o), calories: 1400, protein_g: 90, carbs_g: 100, fat_g: 30 },
        { logged_date: dayOf(W, o), calories: 950, protein_g: 60, carbs_g: 80, fat_g: 20 },
      ])
      const m = buildProgressEnergyTrends(inputs({
        foodRows: mixedFood, targetHistory: mixedHistory,
        explicitCompleteDates: new Set([0, 1, 3, 4, 5].map((o) => dayOf(W, o))),
      }))
      return m.intakeWeeks[7].averageTargetCalories === 2180 &&
        m.intakeWeeks[7].hasTargetTransition === true
    })())
  check('RC14: 5B.4 Coach behavior is unchanged by this correction',
    (() => {
      const coach = read('src/lib/goal-adjustments.ts')
      return coach.includes('MIN_COMPLETE_DAYS_FOR_PROPOSAL = 5') &&
        coach.includes('MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT = 3') &&
        !coach.includes('scroll={false}') && !coach.includes('5B.5')
    })())
  check('RC15: no data mutation introduced by this correction',
    !/\.(insert|update|upsert|delete)\(/.test(stripComments(section)) &&
    !/\.(insert|update|upsert|delete)\(/.test(stripComments(page)))
}

// ── 11. Docs and hygiene ─────────────────────────────────────────────
console.log('\n11. Docs and hygiene')
{
  check('notes document evidence semantics and thresholds',
    notes.includes('explicit') && notes.includes('heuristic') &&
    notes.includes('WEEK_CONFIDENT_DAYS'))
  check('notes document the no-chart-library decision',
    /chart library|plain SVG/i.test(notes))
  check('notes document historical target resolution',
    notes.includes('effective_date') && /retroactive/i.test(notes))
  check('notes document the leakage-safe maintenance decision',
    /leakage/i.test(notes))
  check('notes record no migration', /no migration/i.test(notes))
  check('no legacy brand violations',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
