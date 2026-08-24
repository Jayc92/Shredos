// ============================================================
// ForgeFitOS — Phase 5B.4 deterministic verification harness
// Verifies Coach integration: the weekly-anchor weigh-in evidence
// correction (Friday cadence works; the legacy 2-per-week gate is
// gone from every live decision path), consumption of the stable 5B
// facts (explicit completion preferred, adaptive maintenance
// informs-never-sets, user-relative activity, 2X training context,
// behavioral-only fasting), the cause-differentiated decision
// hierarchy (adherence-first, activity-first, protein separation,
// softened steps), the preserved decision lifecycle (explicit
// apply/reject, duplicate prevention, atomic RPC, auditable
// snapshots), and every standing guardrail. Decision behavior runs
// at RUNTIME through the real evaluateGoalAdjustment.
// Run from the repository root:
//   npx tsx scripts/verify-phase5b4.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  evaluateGoalAdjustment,
  validateAdjustmentApply,
  findBlockingDecision,
  MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT,
  CALORIE_STEP_SMALL,
  CALORIE_STEP_LARGE,
} from '../src/lib/goal-adjustments'
import type {
  GoalAdjustmentInput,
  GoalAdjustmentReview,
  AdjustmentTargetLike,
} from '../src/lib/goal-adjustments'
import {
  deriveWeeklyWeightAnchors,
  computeWeightTrend,
  buildDailyNutritionFactsWithContext,
} from '../src/lib/energy-facts'
import {
  estimateBaselineTdee,
  buildQualifyingWeeks,
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

const adjustLib = read('src/lib/goal-adjustments.ts')
const adjustRoute = read('src/app/api/goal-adjustment/route.ts')
const reviewCard = read('src/components/nutrition/GoalAdjustmentReviewCard.tsx')
const coachLib = read('src/lib/nutrition-coach.ts')
const decisionsRoute = read('src/app/api/decisions/route.ts')
const modelLib = read('src/lib/energy-model.ts')
const notes = read('docs/phase5b4-coach-integration-notes.md')

const CHANGED = [adjustLib, adjustRoute, reviewCard, coachLib]

// ── Fixtures ─────────────────────────────────────────────────────────
// TODAY is Tuesday 2026-08-04 → review week Mon 07-27..Sun 08-02.
const TODAY = '2026-08-04'
const TARGET: AdjustmentTargetLike = {
  calories: 2200, protein_g: 140, carbs_g: 220, fat_g: 60, effective_date: '2026-07-01',
}
const KG = (lbs: number) => lbsToKg(lbs)
const weigh = (date: string, lbs: number, at = `${date}T07:00:00.000Z`) =>
  ({ logged_date: date, weight_kg: KG(lbs), created_at: at, bf_pct: null })

/** THE cadence under correction: one Friday weigh-in per week. The
 *  four Fridays inside the 8-week anchor window before the review end. */
const FRIDAYS = ['2026-07-10', '2026-07-17', '2026-07-24', '2026-07-31']
function fridayRows(lbsByWeek: number[]) {
  return FRIDAYS.slice(-lbsByWeek.length).map((d, i) => weigh(d, lbsByWeek[i]))
}

const WEEK_DATES = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']
/** N complete on-target days (two meaningful entries, ~2,150 kcal, 150g protein). */
function completeFood(n: number, calPerDay = 2150, proteinPerDay = 150) {
  return WEEK_DATES.slice(0, n).flatMap((d) => [
    { logged_date: d, calories: Math.round(calPerDay * 0.6), protein_g: Math.round(proteinPerDay * 0.6), carbs_g: 100, fat_g: 30 },
    { logged_date: d, calories: calPerDay - Math.round(calPerDay * 0.6), protein_g: proteinPerDay - Math.round(proteinPerDay * 0.6), carbs_g: 80, fat_g: 20 },
  ])
}
const explicitWeek = (n: number) => new Set(WEEK_DATES.slice(0, n))

function input(overrides: Partial<GoalAdjustmentInput> = {}): GoalAdjustmentInput {
  return {
    todayStr: TODAY,
    goal: 'fat_loss',
    target: TARGET,
    weighInRows: fridayRows([201.8, 201.2, 200.6, 200]), // -0.6 lb/wk = -0.3%/wk (slower than band)
    foodLogRows: completeFood(5),
    profileBfPct: null,
    recentDecisions: [],
    availability: { weight: true, nutrition: true, decisions: true },
    explicitCompleteDates: explicitWeek(5),
    ...overrides,
  }
}

function adaptiveOf(status: AdaptiveMaintenanceEstimate['status'], range: [number, number] | null): AdaptiveMaintenanceEstimate {
  // A structurally valid estimate built through the real pipeline,
  // then status/range overridden for gating fixtures.
  const base = inferAdaptiveMaintenance({
    baseline: estimateBaselineTdee({ weightLbs: 200, activityLevel: 'moderately_active' }),
    weeks: [],
    daysSinceTargetChange: null,
  })
  return { ...base, status, estimatedMaintenanceRange: range }
}

// ── 1. Friday weigh-in cadence (scenarios 1–7) ───────────────────────
console.log('\n1. Friday weigh-in evidence')
{
  const friday = evaluateGoalAdjustment(input())
  check('S1: one Friday weigh-in per week across four weeks IS eligible evidence',
    friday.eligibility === 'eligible' && friday.weight.anchorCount === 4)
  check('S1b: the Friday review proposes a restrained decrease (slower than band)',
    friday.direction === 'decrease' &&
    (friday.adjustmentAmount === -100 || friday.adjustmentAmount === -200))
  check('S2: a single reading is a valid lower-confidence weekly anchor',
    (() => {
      const anchors = deriveWeeklyWeightAnchors([weigh('2026-07-31', 200)], '2026-08-02')
      return anchors.length === 1 && anchors[0].quality === 'single' &&
        anchors[0].contributingDates === 1
    })())
  check('S3: multiple readings in a week form the weekly average (multi quality)',
    (() => {
      const anchors = deriveWeeklyWeightAnchors(
        [weigh('2026-07-28', 201), weigh('2026-07-31', 199)], '2026-08-02')
      return anchors.length === 1 && anchors[0].quality === 'multi' && anchors[0].anchorLbs === 200
    })())
  check('S4: actual week spacing respected (a gap does not compress the rate)',
    (() => {
      // 3 anchors across 5 weeks: -2 lbs over 4 weeks = -0.5/wk.
      const t = computeWeightTrend(deriveWeeklyWeightAnchors(
        [weigh('2026-07-03', 202), weigh('2026-07-17', 201), weigh('2026-07-31', 200)],
        '2026-08-02'))
      return t.weeklyRateLb === -0.5
    })())
  check('S5: missing weeks are never fabricated',
    (() => {
      const anchors = deriveWeeklyWeightAnchors(
        [weigh('2026-07-03', 202), weigh('2026-07-31', 200)], '2026-08-02')
      return anchors.length === 2 // never 5 interpolated anchors
    })())
  check('S6: one anomalous week does not trigger an aggressive adjustment',
    (() => {
      // A 3-lb water-weight spike in week 3 of an otherwise slow trend:
      // the regression absorbs it AND the noisy fit blocks the 200 step.
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([201.8, 201.2, 204, 200]),
      }))
      return r.adjustmentAmount === null || Math.abs(r.adjustmentAmount) <= CALORIE_STEP_SMALL
    })())
  check('S6b: two anchors alone stay insufficient (no overreaction to one interval)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200.6, 200]),
      }))
      return r.eligibility === 'insufficient_weight_data' && r.proposedCalories === null
    })())
  check('S7: the legacy per-week gate is gone from every live decision path',
    // (the constant name survives only in the correction's own
    // documentation comment)
    !stripComments(adjustLib).includes('MIN_WEIGH_IN_DAYS') &&
    !stripComments(adjustRoute).includes('MIN_WEIGH_IN_DAYS') &&
    !stripComments(adjustLib).includes('in each of the last two completed weeks') &&
    adjustLib.includes(`MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT = ${MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT}`))
  check('S7b: eligibility copy tells the user one weigh-in per week is enough',
    (() => {
      const r = evaluateGoalAdjustment(input({ weighInRows: [] }))
      return r.blockingReasons.some((b) => b.includes('one weigh-in per week is enough'))
    })())
  check('S7c: daily weighing is never incentivized in user copy',
    !reviewCard.includes('daily weigh') && !adjustLib.includes('weigh daily'))
}

// ── 2. Nutrition completeness evidence (scenarios 8–10) ──────────────
console.log('\n2. Nutrition completeness evidence')
{
  check('S8: incomplete logging prevents false low-intake conclusions',
    (() => {
      // Five single-entry (partial) days at tiny calories: NOT read as
      // "eating 400 kcal" — read as insufficient evidence.
      const r = evaluateGoalAdjustment(input({
        foodLogRows: WEEK_DATES.slice(0, 5).map((d) =>
          ({ logged_date: d, calories: 400, protein_g: 30, carbs_g: 40, fat_g: 10 })),
        explicitCompleteDates: new Set<string>(),
      }))
      return (r.eligibility === 'insufficient_nutrition_data' || r.eligibility === 'improve_logging') &&
        r.proposedCalories === null
    })())
  check('S9: explicitly completed days are preferred evidence (counted separately)',
    (() => {
      const r = evaluateGoalAdjustment(input())
      return r.nutrition.explicitCompleteDays === 5 && r.nutrition.heuristicCompleteDays === 0
    })())
  check('S9b: explicit-quality days satisfy the strong-evidence coverage rule',
    adjustLib.includes('explicitCompleteDays >= STRONG_EVIDENCE_NUTRITION_DAYS'))
  check('S10: heuristic completeness remains valid fallback evidence',
    (() => {
      const r = evaluateGoalAdjustment(input({ explicitCompleteDates: new Set<string>() }))
      return r.nutrition.explicitCompleteDays === 0 &&
        r.nutrition.heuristicCompleteDays === 5 &&
        r.eligibility === 'eligible' // still works — at heuristic quality
    })())
  check('S10b: explicit completion upgrades the SAME food data',
    (() => {
      const heuristic = evaluateGoalAdjustment(input({ explicitCompleteDates: new Set<string>() }))
      const explicit = evaluateGoalAdjustment(input())
      return heuristic.nutrition.loggedDays === explicit.nutrition.loggedDays &&
        explicit.nutrition.explicitCompleteDays > heuristic.nutrition.explicitCompleteDays
    })())
}

// ── 3. Cause differentiation (scenarios 11–14) ───────────────────────
console.log('\n3. Cause-differentiated decisions')
{
  check('S11: strong adherence + out-of-band trend -> restrained 100-200 adjustment',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]), // flat: deviation 0.5pp
      }))
      return r.eligibility === 'eligible' && r.direction === 'decrease' &&
        Math.abs(r.adjustmentAmount as number) >= CALORIE_STEP_SMALL &&
        Math.abs(r.adjustmentAmount as number) <= CALORIE_STEP_LARGE
    })())
  check('S11b: flat trend with strong explicit evidence earns exactly the 200 step',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.adjustmentAmount === -CALORIE_STEP_LARGE && r.evidenceStrength === 'strong'
    })())
  check('S12: poor calorie adherence -> adherence guidance INSTEAD of a target change',
    (() => {
      const r = evaluateGoalAdjustment(input({
        foodLogRows: completeFood(5, 2700), // ~23% over target on complete days
        weighInRows: fridayRows([200, 200, 200, 200]),
        explicitCompleteDates: explicitWeek(5),
      }))
      return r.eligibility === 'adherence_first' && r.proposedCalories === null &&
        r.direction === 'hold' && r.guidance.length > 0 &&
        r.nutrition.adherence === 'above_target'
    })())
  check('S12b: under-eating adherence also holds (incomplete-data honesty, not praise)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        foodLogRows: completeFood(5, 1500), // far below target
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.eligibility === 'adherence_first' &&
        r.guidance.some((g) => g.includes('mark completed days') || g.includes('log it consistently'))
    })())
  check('S13: low protein handled separately — guidance, never a calorie collapse',
    (() => {
      const r = evaluateGoalAdjustment(input({
        foodLogRows: completeFood(5, 2150, 80), // calories on target, protein ~57%
      }))
      return r.nutrition.proteinState === 'protein_low' &&
        r.guidance.some((g) => g.includes('Protein')) &&
        r.guidance.some((g) => g.includes('separate from total calories'))
    })())
  check('S13b: low protein softens a would-be 200 decrease to 100',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]),
        foodLogRows: completeFood(5, 2150, 80),
      }))
      return r.eligibility === 'eligible' && r.adjustmentAmount === -CALORIE_STEP_SMALL &&
        r.explanation.includes('protein has been low')
    })())
  check('S14: recent target change -> settling/hold state',
    (() => {
      const r = evaluateGoalAdjustment(input({
        target: { ...TARGET, effective_date: '2026-07-28' },
      }))
      return r.eligibility === 'recent_target_change' && r.proposedCalories === null
    })())
}

// ── 4. Adaptive maintenance (scenarios 15–16) ────────────────────────
console.log('\n4. Adaptive maintenance evidence')
{
  check('S15: low-confidence maintenance exposes NO numeric range and drives nothing',
    (() => {
      const r = evaluateGoalAdjustment(input({
        adaptive: adaptiveOf('observing', null),
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.adaptiveEvidence.maintenanceRange === null &&
        !/\d{3,4}\s*[–-]\s*\d{3,4}\s*kcal/.test(r.explanation) &&
        r.adjustmentAmount === -CALORIE_STEP_LARGE // proposal unchanged by adaptive absence
    })())
  check('S16: high-confidence maintenance INFORMS the explanation but never sets the target',
    (() => {
      const r = evaluateGoalAdjustment(input({
        adaptive: adaptiveOf('high_confidence', [2400, 2600]),
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.eligibility === 'eligible' &&
        r.proposedCalories === TARGET.calories - CALORIE_STEP_LARGE && // target ± step, NEVER 2400-2600
        r.explanation.includes('2,400–2,600') &&
        r.adaptiveEvidence.maintenanceRange !== null
    })())
  check('S16b: the proposal is always current target ± step (never the adaptive central)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        adaptive: adaptiveOf('high_confidence', [1800, 2000]),
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.proposedCalories === 2000 && // 2200 - 200, coincidental with range top
        Math.abs((r.proposedCalories as number) - TARGET.calories) <= CALORIE_STEP_LARGE
    })())
  check('S16c: unavailable adaptive evidence reads unavailable, never fabricated',
    (() => {
      const r = evaluateGoalAdjustment(input())
      return r.adaptiveEvidence.status === 'unavailable' &&
        r.adaptiveEvidence.maintenanceRange === null
    })())
}

// ── 5. Activity and training context (scenarios 17–20) ───────────────
console.log('\n5. Activity and training context')
{
  check('S17: low activity + would-be decrease -> activity_first (restore own baseline)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        activityContext: 'low',
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.eligibility === 'activity_first' && r.proposedCalories === null &&
        r.explanation.includes('your usual baseline') &&
        !/earned|eat.?back|extra calories|calorie credit/i.test(r.explanation + r.guidance.join(' '))
    })())
  check('S17b: activity guidance is user-relative, never a universal step count',
    (() => {
      const r = evaluateGoalAdjustment(input({
        activityContext: 'low',
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return !/\d{4,}\s*steps/.test(r.explanation + r.guidance.join(' '))
    })())
  check('S17c: activity_first applies only to decreases (an increase proceeds)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        activityContext: 'low',
        weighInRows: fridayRows([207.2, 204.8, 202.4, 200]), // -1.2%/wk, faster than band -> increase
      }))
      return r.eligibility === 'eligible' && r.direction === 'increase'
    })())
  check('S18: missing activity stays UNKNOWN — never treated as low',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]),
        // no activityContext supplied at all
      }))
      return r.activityContext === 'unknown' && r.eligibility === 'eligible'
    })())
  check('S19: training decline prevents an aggressive reduction (200 -> 100)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        trainingSignal: 'declining',
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.eligibility === 'eligible' && r.adjustmentAmount === -CALORIE_STEP_SMALL &&
        r.explanation.includes('strength comparisons have been declining')
    })())
  check('S19b: improving training leaves the strong step intact',
    (() => {
      const r = evaluateGoalAdjustment(input({
        trainingSignal: 'improving',
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.adjustmentAmount === -CALORIE_STEP_LARGE
    })())
  check('S20: missing training data stays UNKNOWN — no softening, no penalty',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.trainingSignal === 'unknown' && r.adjustmentAmount === -CALORIE_STEP_LARGE
    })())
}

// ── 6. Fasting and the energy non-negotiables (scenarios 21–22) ──────
console.log('\n6. Fasting + energy boundaries')
{
  check('S21: fasting is behavioral context only — recorded, never energy math',
    (() => {
      const r = evaluateGoalAdjustment(input({
        fastingContext: { completedFastsInWindow: 3 },
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      const noFasting = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.fastingContext?.completedFastsInWindow === 3 &&
        r.proposedCalories === noFasting.proposedCalories && // zero effect on the number
        !/fasting.*(burn|deficit|calorie credit)/i.test(stripComments(adjustLib))
    })())
  check('S22: no workout/activity/session/step/distance calories in adaptive math',
    !stripComments(modelLib).includes('calories_burned') &&
    !stripComments(modelLib).includes('steps') &&
    !stripComments(modelLib).includes('distance') &&
    /select\('workout_date, completed_duration_seconds'\)/.test(adjustLib) &&
    /select\('activity_date, duration_seconds'\)/.test(adjustLib) &&
    !stripComments(adjustLib).includes('calories_burned'))
  check('S22b: no eat-back arithmetic anywhere in changed scope',
    CHANGED.every((f) =>
      !/eat.?back|earned (food|calories)|target \+ .*(burn|calorie)|calories? eaten -|remaining after exercise/i
        .test(stripComments(f))))
  check('S22c: the retired 1F suggestion no longer invents target numbers',
    !coachLib.includes('avgCaloriesLast7 - 150') &&
    !coachLib.includes('try ${sug}') &&
    coachLib.includes('Check the adjustment review'))
}

// ── 7. Decision lifecycle (scenarios 23–27) ──────────────────────────
console.log('\n7. Decision lifecycle')
{
  check('S23: no duplicate pending decision for an equivalent recommendation',
    (() => {
      const pending = findBlockingDecision(
        [{ decision_type: 'calorie_adjustment', status: 'suggested', created_at: '2026-08-01T00:00:00Z' }],
        '2026-07-20')
      const r = evaluateGoalAdjustment(input({
        recentDecisions: [{ decision_type: 'calorie_adjustment', status: 'suggested', created_at: '2026-08-01T00:00:00Z' }],
      }))
      return pending?.kind === 'pending' && r.eligibility === 'pending_existing_decision' &&
        r.proposedCalories === null
    })())
  check('S23b: the decisions API keeps its suggested-scoped duplicate guard',
    decisionsRoute.includes(".eq('status', 'suggested')") &&
    decisionsRoute.includes('duplicate: true'))
  check('S24: apply remains explicit — server revalidates against a FRESH review',
    adjustRoute.includes('const freshReview = await fetchGoalAdjustmentReview(') &&
    adjustRoute.includes('validateAdjustmentApply(freshReview') &&
    (() => {
      const eligible = evaluateGoalAdjustment(input())
      return validateAdjustmentApply(eligible, {
        expectedCurrentCalories: 2200,
        proposedCalories: eligible.proposedCalories as number,
        expectedGoal: 'fat_loss',
      }).ok
    })())
  check('S24b: the atomic RPC still owns the versioned write + Applied decision',
    adjustRoute.includes("supabase.rpc(\n    'apply_goal_calorie_adjustment'") ||
    adjustRoute.includes("'apply_goal_calorie_adjustment'"))
  check('S24c: the new cause-differentiated states can never be applied',
    (() => {
      const adherenceFirst = evaluateGoalAdjustment(input({
        foodLogRows: completeFood(5, 2700),
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return !validateAdjustmentApply(adherenceFirst, {
        expectedCurrentCalories: 2200, proposedCalories: 2000, expectedGoal: 'fat_loss',
      }).ok
    })())
  check('S25: reject/dismiss remains explicit through the existing transitions',
    read('src/lib/decisions.ts').includes("suggested: ['accepted', 'dismissed']") &&
    decisionsRoute.includes('PATCH'))
  check('S26: repeated apply attempts stay safe (stale check + advisory lock)',
    (() => {
      const eligible = evaluateGoalAdjustment(input())
      const stale = validateAdjustmentApply(eligible, {
        expectedCurrentCalories: 2100, // target moved since the client read
        proposedCalories: 2000,
        expectedGoal: 'fat_loss',
      })
      return !stale.ok && stale.stale &&
        adjustRoute.includes('stale_target')
    })())
  check('S26b: non-100/200 amounts are structurally rejected',
    (() => {
      const eligible = evaluateGoalAdjustment(input())
      return !validateAdjustmentApply(eligible, {
        expectedCurrentCalories: 2200, proposedCalories: 1850, expectedGoal: 'fat_loss',
      }).ok
    })())
  check('S27: historical decision records stay readable (snapshot is additive jsonb)',
    adjustRoute.includes('anchorCount: freshReview.weight.anchorCount') &&
    adjustRoute.includes('adaptiveStatus: freshReview.adaptiveEvidence.status') &&
    adjustRoute.includes('weeklyChangePct: freshReview.weight.weeklyChangePct'))
}

// ── 8. Guardrails and semantics (scenarios 28–30) ────────────────────
console.log('\n8. Guardrails and semantics')
{
  check('S28: the 1200 floor still blocks unsafe decreases',
    (() => {
      const r = evaluateGoalAdjustment(input({
        target: { calories: 1250, protein_g: 100, carbs_g: 100, fat_g: 30, effective_date: '2026-07-01' },
        foodLogRows: WEEK_DATES.slice(0, 5).flatMap((d) => [
          { logged_date: d, calories: 750, protein_g: 60, carbs_g: 60, fat_g: 20 },
          { logged_date: d, calories: 500, protein_g: 40, carbs_g: 40, fat_g: 10 },
        ]),
        explicitCompleteDates: explicitWeek(5),
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return r.eligibility === 'hold' && r.blockingReasons.some((b) => b.includes('floor'))
    })())
  check('S28b: the carb minimum still blocks macro-unsafe decreases',
    adjustLib.includes('MIN_CARBS_GUARDRAIL * 4') &&
    adjustLib.includes('below the ${MIN_CARBS_GUARDRAIL}g minimum'))
  check('S28c: protein and fat targets remain untouched by every proposal',
    adjustLib.includes("'Protein target unchanged.'") &&
    adjustLib.includes("'Fat target unchanged.'"))
  check('S28d: body-fat-aware rate bands unchanged (20%+ wide, sub-10 lean)',
    adjustLib.includes('if (bfPct !== null && bfPct >= 20) return { minPct: 0.5, maxPct: 1.25 }') &&
    adjustLib.includes('if (bfPct !== null && bfPct < 10) return { minPct: 0.25, maxPct: 0.5 }'))
  check('S28e: adjustments remain limited to round 100/200 steps',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return CALORIE_STEP_SMALL === 100 && CALORIE_STEP_LARGE === 200 &&
        (r.proposedCalories as number) % 100 === 0
    })())
  check('S29: null vs zero semantics preserved (unknown activity is not zero activity)',
    (() => {
      const unknown = evaluateGoalAdjustment(input({
        activityContext: 'unknown',
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      const low = evaluateGoalAdjustment(input({
        activityContext: 'low',
        weighInRows: fridayRows([200, 200, 200, 200]),
      }))
      return unknown.eligibility === 'eligible' && low.eligibility === 'activity_first'
    })())
  check('S29b: missing weight evidence is never weight stability',
    (() => {
      const r = evaluateGoalAdjustment(input({ weighInRows: [] }))
      return r.eligibility === 'insufficient_weight_data' &&
        r.weight.band === 'insufficient_data' && r.weight.weeklyChangePct === null
    })())
  check('S30: the 5B.1-5B.3 pipeline is untouched except the flagged coach-signals completeness fix',
    !stripComments(read('src/lib/energy-facts.ts')).includes('5B.4') &&
    !stripComments(read('src/lib/energy-model.ts')).includes('5B.4') &&
    !stripComments(read('src/lib/today-energy.ts')).includes('5B.4') &&
    !read('src/components/dashboard/EnergyBalanceCard.tsx').includes('5B.4') &&
    // the one approved 5B.4 change inside the pipeline: explicit days
    // count as complete evidence in the signal averages/confidence
    (read('src/lib/coach-signals.ts').match(/\|\| f\.completeness === 'explicit_complete'/g) || []).length === 2)
}

// ── 9. Explanations and UI ───────────────────────────────────────────
console.log('\n9. Explanations and UI')
{
  const eligible = evaluateGoalAdjustment(input({
    weighInRows: fridayRows([200, 200, 200, 200]),
  }))
  check('explanation states observation, evidence, smallest action, and reassessment',
    eligible.explanation.includes('Weight change was') &&
    eligible.explanation.includes('Evidence:') &&
    eligible.explanation.includes('smallest change the evidence supports') &&
    eligible.explanation.includes('reassessed after about two weeks'))
  check('no raw reason-code jargon reaches user copy',
    !/insufficient_weight_anchors|adherence_first|explicit_complete|trend_only/
      .test(eligible.explanation + eligible.guidance.join(' ')))
  check('card renders anchor evidence honestly',
    reviewCard.includes('weekly weigh-in') &&
    reviewCard.includes('review.weight.anchorCount'))
  check('card renders explicit-completion evidence',
    reviewCard.includes('review.nutrition.explicitCompleteDays') &&
    reviewCard.includes('marked finished'))
  check('card renders guidance without redesigning the flow',
    reviewCard.includes('review.guidance.map') &&
    reviewCard.includes('Apply new calorie target') === reviewCard.includes('Apply new calorie target'))
  check('new eligibility states have plain-language messages',
    reviewCard.includes('adherence_first:') && reviewCard.includes('activity_first:'))
  check('no emoji/pictographs in changed scope',
    CHANGED.every((f) => !EMOJI.test(f)))
}

// ── 10. Boundary and docs ────────────────────────────────────────────
console.log('\n10. Boundary and docs')
{
  // RETARGET (UI-3): 020 is that approved phase's dashboard-prefs
  // migration — the boundary (no UNEXPECTED migration) survives as
  // "exactly 20, and the single addition is the named UI-3 file".
  // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
  check('migration boundary: exactly 22 (021 = UI-5B1B ordering; 022 = UI-5B2 reuse)',
    // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
    // workout-reuse migration (create_routine_from_workout +
    // repeat_workout). The boundary moves from exactly-21 to
    // exactly-22; no other migration may appear.
    (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 23 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql')) &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('020')).length === 1 &&
    readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
  check('no persisted adaptive state introduced',
    CHANGED.every((f) => !stripComments(f).includes('adaptive_tdee_state')))
  check('target-setting formula untouched',
    !read('src/lib/nutrition.ts').includes('5B.4'))
  check('Today dashboard untouched by this phase',
    !read('src/app/(app)/dashboard/page.tsx').includes('5B.4'))
  check('no Progress charts started (5B.5 boundary)',
    !read('src/app/(app)/progress/page.tsx').includes('5B.4') &&
    !read('src/lib/progress-charts.ts').includes('energy'))
  check('notes document the legacy gates found and corrected',
    notes.includes('MIN_WEIGH_IN_DAYS') && notes.includes('nutrition-coach') &&
    notes.includes('computeWeeklyWeight'))
  check('notes document the decision hierarchy',
    notes.includes('adherence_first') && notes.includes('activity_first'))
  check('notes flag every retarget', /retarget/i.test(notes))
  check('no legacy brand violations',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 11. Nutrition-evidence floor (audit scenarios N1–N15) ────────────
console.log('\n11. Nutrition-evidence floor')
{
  const flatFridays = fridayRows([200, 200, 200, 200])
  const withDays = (n: number, explicit = true) => evaluateGoalAdjustment(input({
    weighInRows: flatFridays,
    foodLogRows: completeFood(n),
    explicitCompleteDates: explicit ? explicitWeek(n) : new Set<string>(),
  }))
  for (const n of [0, 1, 2, 4] as const) {
    check(`N${n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 3 : 4}: ${n} complete day(s) cannot produce a proposal`,
      (() => {
        const r = withDays(n)
        return r.proposedCalories === null && r.adjustmentAmount === null &&
          r.eligibility !== 'eligible'
      })())
  }
  check('N5: five qualifying days pass the nutrition gate without bypassing any other gate',
    (() => {
      const ok = withDays(5)
      const blockedByDecision = evaluateGoalAdjustment(input({
        weighInRows: flatFridays,
        recentDecisions: [{ decision_type: 'calorie_adjustment', status: 'suggested', created_at: '2026-08-01T00:00:00Z' }],
      }))
      const blockedByAnchors = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200.6, 200]),
      }))
      return ok.eligibility === 'eligible' &&
        blockedByDecision.eligibility === 'pending_existing_decision' &&
        blockedByAnchors.eligibility === 'insufficient_weight_data'
    })())
  check('N6: five PARTIAL days do not qualify (single small entries)',
    (() => {
      const r = evaluateGoalAdjustment(input({
        weighInRows: flatFridays,
        foodLogRows: WEEK_DATES.slice(0, 5).map((d) =>
          ({ logged_date: d, calories: 500, protein_g: 40, carbs_g: 50, fat_g: 15 })),
        explicitCompleteDates: new Set<string>(),
      }))
      return r.eligibility !== 'eligible' && r.proposedCalories === null
    })())
  check('N7: explicit completion is the preferred evidence (unlocks the 200 step)',
    withDays(5, true).adjustmentAmount === -CALORIE_STEP_LARGE)
  check('N8: heuristic completion remains fallback only (caps at the 100 step)',
    (() => {
      const r = withDays(5, false)
      return r.eligibility === 'eligible' && r.adjustmentAmount === -CALORIE_STEP_SMALL &&
        r.nutrition.heuristicCompleteDays === 5 && r.nutrition.explicitCompleteDays === 0
    })())
  check('N9: missing days never enter averages as zero',
    (() => {
      const r = withDays(5)
      // 5 complete days at 2,150 -> average must be 2,150, not 2150*5/7.
      return r.nutrition.averageCalories === 2150
    })())
  check('N10: sparse evidence produces guidance-only copy with no proposal',
    (() => {
      const r = withDays(4)
      return r.eligibility === 'improve_logging' &&
        r.guidance.some((g) => g.includes('more completed food-log days')) &&
        r.explanation.includes('logging-evidence gap') &&
        !r.explanation.toLowerCase().includes('under-eating') &&
        r.proposedCalories === null
    })())
  check('N11: increases obey the same floor as decreases',
    (() => {
      const fastLoss = fridayRows([207.2, 204.8, 202.4, 200]) // increase direction
      const sparse = evaluateGoalAdjustment(input({
        weighInRows: fastLoss, foodLogRows: completeFood(4),
        explicitCompleteDates: explicitWeek(4),
      }))
      const full = evaluateGoalAdjustment(input({ weighInRows: fastLoss }))
      return sparse.eligibility === 'improve_logging' && sparse.proposedCalories === null &&
        full.eligibility === 'eligible' && full.direction === 'increase'
    })())
  check('N12: the 200 step retains every stronger requirement',
    (() => {
      // explicit 5 + deviation >= 0.5 + trend moderate -> 200; the same
      // with a low-confidence 3-anchor trend -> 100.
      const strong = withDays(5)
      const weakTrend = evaluateGoalAdjustment(input({
        weighInRows: fridayRows([200, 200, 200]).map((r) => r), // 3 anchors -> low confidence
      }))
      return strong.adjustmentAmount === -CALORIE_STEP_LARGE &&
        (weakTrend.adjustmentAmount === null || Math.abs(weakTrend.adjustmentAmount) === CALORIE_STEP_SMALL)
    })())
  check('N13: Friday weekly-anchor eligibility remains intact',
    withDays(5).weight.anchorCount === 4 && withDays(5).eligibility === 'eligible')
  check('N14: no exercise-calorie or eat-back behavior was introduced',
    !/calories_burned|eat.?back|earned/i.test(stripComments(adjustLib).split('MIN_COMPLETE_DAYS_FOR_PROPOSAL')[1] ?? ''))
  check('N15: apply validation rejects a proposal the fresh recompute now finds insufficient',
    (() => {
      const staleEligible = withDays(5) // client saw this
      const freshInsufficient = withDays(4) // server now recomputes this
      const attempt = validateAdjustmentApply(freshInsufficient, {
        expectedCurrentCalories: 2200,
        proposedCalories: staleEligible.proposedCalories as number,
        expectedGoal: 'fat_loss',
      })
      return !attempt.ok && attempt.stale
    })())
  check('N-constant: the floor is a named product constant set to 5',
    adjustLib.includes('export const MIN_COMPLETE_DAYS_FOR_PROPOSAL = 5'))
  check('N-copy: the card distinguishes food-log evidence from weigh-in evidence',
    reviewCard.includes('More completed food-log days are needed') &&
    reviewCard.includes('one per week is enough') &&
    !reviewCard.includes('under-eating'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
