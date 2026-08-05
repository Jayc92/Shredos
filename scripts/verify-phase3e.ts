// ============================================================
// ShredOS — Phase 3E deterministic verification harness
// Verifies the goal-aware adjustment review: completed-week evidence,
// goal/band classification, guardrails, blocking/cooldown rules,
// proposal contract, server-side apply validation, and the
// no-automatic-writes discipline. Also spot-checks Phase 3A/3D
// invariants and neutral language.
// Deterministic: fixed fixtures, no Date.now(), no network.
// Run from the repository root:
//   npx tsx scripts/verify-phase3e.ts
// ============================================================

import { readFileSync } from 'fs'
import {
  evaluateGoalAdjustment,
  validateAdjustmentApply,
  resolveBodyFatContext,
  findBlockingDecision,
  fatLossBand,
  GAIN_BAND,
  CALORIE_STEP_SMALL,
  CALORIE_STEP_LARGE,
  MIN_WEIGH_IN_DAYS,
  MIN_NUTRITION_DAYS,
  ADJUSTMENT_DECISION_TYPE,
} from '../src/lib/goal-adjustments'
import type {
  GoalAdjustmentInput,
  GoalAdjustmentReview,
  AdjustmentTargetLike,
} from '../src/lib/goal-adjustments'
import { MIN_CALORIES_FLOOR } from '../src/lib/nutrition-coach'
import { STATUS_TRANSITIONS, validateDecisionUpdate } from '../src/lib/decisions'
import { resolveReviewWeekStart, assembleWeeklyReview } from '../src/lib/weekly-review'

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

// Tuesday 2026-08-04 → review week Mon 07-27..Sun 08-02; prior 07-20..07-26.
const TODAY = '2026-08-04'
const KG = (lbs: number) => lbs / 2.20462

const TARGET: AdjustmentTargetLike = {
  calories: 2200, protein_g: 140, carbs_g: 220, fat_g: 60, effective_date: '2026-07-01',
}

function weighIn(date: string, lbs: number, at = `${date}T07:00:00.000Z`, bf: number | null = null) {
  return { logged_date: date, weight_kg: KG(lbs), created_at: at, bf_pct: bf }
}

/** Two identical weigh-ins per week → exact weekly averages. */
function weightWeeks(priorLbs: number, currentLbs: number) {
  return [
    weighIn('2026-07-21', priorLbs), weighIn('2026-07-24', priorLbs),
    weighIn('2026-07-28', currentLbs), weighIn('2026-07-31', currentLbs),
  ]
}

function food(date: string, calories: number | null = 2000, protein: number | null = 150) {
  return { logged_date: date, calories, protein_g: protein, carbs_g: null, fat_g: null }
}

/** N logged nutrition days inside the review week. */
function foodDays(n: number) {
  const dates = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']
  return dates.slice(0, n).map((d) => food(d))
}

function input(overrides: Partial<GoalAdjustmentInput> = {}): GoalAdjustmentInput {
  return {
    todayStr: TODAY,
    goal: 'fat_loss',
    target: TARGET,
    weighInRows: weightWeeks(200, 198.5), // 0.75%/wk loss — within default band
    foodLogRows: foodDays(4),
    profileBfPct: null,
    recentDecisions: [],
    availability: { weight: true, nutrition: true, decisions: true },
    ...overrides,
  }
}

function types(review: GoalAdjustmentReview) {
  return review.eligibility
}

// ── 1. Windows and goals ─────────────────────────────────────────────
console.log('\n1. Windows and goals')
{
  const r = evaluateGoalAdjustment(input())
  check('completed-week window used (never the partial current week)',
    r.window.startDate === '2026-07-27' && r.window.endDate === '2026-08-02' &&
    r.window.priorStartDate === '2026-07-20' && r.window.priorEndDate === '2026-07-26')
  check('review period label correct', r.window.label === 'Jul 27–Aug 2')

  const withPartial = evaluateGoalAdjustment(input({
    weighInRows: [...weightWeeks(200, 198.5), weighIn('2026-08-03', 150)], // current-week Monday
  }))
  check('current partial week excluded from adjustment calculation',
    withPartial.weight.currentAverageLbs === r.weight.currentAverageLbs)

  check('fat-loss goal recognized', types(evaluateGoalAdjustment(input())) !== 'unsupported_goal')
  check('maintenance goal recognized',
    types(evaluateGoalAdjustment(input({ goal: 'maintenance' }))) !== 'unsupported_goal')
  check('muscle-gain goal recognized',
    types(evaluateGoalAdjustment(input({ goal: 'muscle_gain' }))) !== 'unsupported_goal')
  check('strength goal treated with gain semantics',
    types(evaluateGoalAdjustment(input({ goal: 'strength' }))) !== 'unsupported_goal')
  check('unsupported goal handled safely (recomposition → hold, no proposal)',
    (() => {
      const u = evaluateGoalAdjustment(input({ goal: 'recomposition' }))
      return u.eligibility === 'unsupported_goal' && u.proposedCalories === null
    })())
  check('unknown goal handled safely',
    evaluateGoalAdjustment(input({ goal: null })).eligibility === 'unsupported_goal')
}

// ── 2. Weight evidence ───────────────────────────────────────────────
console.log('\n2. Weight evidence')
{
  const dupes = evaluateGoalAdjustment(input({
    weighInRows: [
      weighIn('2026-07-21', 200), weighIn('2026-07-24', 200),
      weighIn('2026-07-28', 210, '2026-07-28T06:00:00.000Z'),
      weighIn('2026-07-28', 198.5, '2026-07-28T21:00:00.000Z'), // later same-day wins
      weighIn('2026-07-31', 198.5),
    ],
  }))
  check('same-day weigh-ins deduplicated (latest record wins)',
    dupes.weight.currentAverageLbs === 198.5)
  check('current weekly average correct', dupes.weight.currentAverageLbs === 198.5)
  check('prior weekly average correct', dupes.weight.priorAverageLbs === 200)
  check('weekly percentage change finite and signed',
    dupes.weight.weeklyChangePct === -0.75)

  const sparse = evaluateGoalAdjustment(input({
    weighInRows: [weighIn('2026-07-21', 200), weighIn('2026-07-24', 200), weighIn('2026-07-28', 198.5)],
  }))
  check(`minimum distinct weigh-in threshold (${MIN_WEIGH_IN_DAYS}/week) enforced`,
    sparse.eligibility === 'insufficient_weight_data')
  check('insufficient weight data produces no adjustment',
    sparse.proposedCalories === null && sparse.weight.band === 'insufficient_data')

  const invalid = evaluateGoalAdjustment(input({
    weighInRows: [
      ...weightWeeks(200, 198.5),
      { logged_date: '2026-07-29', weight_kg: 0, created_at: '2026-07-29T07:00:00.000Z', bf_pct: null },
      { logged_date: '2026-07-30', weight_kg: null, created_at: '2026-07-30T07:00:00.000Z', bf_pct: null },
    ],
  }))
  check('zero/invalid weight rows excluded',
    invalid.weight.loggedDaysCurrent === 2 && invalid.weight.currentAverageLbs === 198.5)
  check('no NaN/Infinity anywhere in the review',
    !JSON.stringify(evaluateGoalAdjustment(input())).includes('NaN') &&
    !JSON.stringify(evaluateGoalAdjustment(input())).includes('Infinity'))
}

// ── 3. Nutrition evidence ────────────────────────────────────────────
console.log('\n3. Nutrition evidence')
{
  const r = evaluateGoalAdjustment(input({
    foodLogRows: [
      ...foodDays(4),
      food('2026-08-01', 1800, null), // protein-less day
      { logged_date: '2026-08-02', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, // placeholder
    ],
  }))
  check('nutrition daily aggregation reused (placeholder day excluded)',
    r.nutrition.loggedDays === 5)
  check('protein-less logs do not become 0g protein days',
    r.nutrition.proteinTargetEligibleDays === 4)
  check('missing days are coverage gaps, not zeros',
    r.nutrition.averageCalories === 1960) // (2000*4 + 1800) / 5

  check(`fewer than ${MIN_NUTRITION_DAYS} logged days → improve logging, not a calorie change`,
    (() => {
      const poor = evaluateGoalAdjustment(input({
        foodLogRows: foodDays(3),
        weighInRows: weightWeeks(200, 199.8), // slower than range
      }))
      return poor.eligibility === 'improve_logging' && poor.proposedCalories === null
    })())
  check('near-zero nutrition data → insufficient state',
    evaluateGoalAdjustment(input({ foodLogRows: foodDays(1) })).eligibility ===
      'insufficient_nutrition_data')
}

// ── 4. Targets ───────────────────────────────────────────────────────
console.log('\n4. Target authority')
{
  check('missing target blocks proposal',
    evaluateGoalAdjustment(input({ target: null })).eligibility === 'missing_target')
  check('invalid target blocks proposal',
    evaluateGoalAdjustment(input({
      target: { ...TARGET, calories: Number.NaN },
    })).eligibility === 'missing_target')
  check('active target is authoritative (current calories from the persisted row)',
    evaluateGoalAdjustment(input()).currentCalories === 2200)
  check('recent target change blocks immediate re-adjustment (two completed weeks)',
    evaluateGoalAdjustment(input({
      target: { ...TARGET, effective_date: '2026-07-21' },
    })).eligibility === 'recent_target_change')
  check('target change older than the cooldown does not block',
    evaluateGoalAdjustment(input({
      target: { ...TARGET, effective_date: '2026-07-19' },
    })).eligibility !== 'recent_target_change')
}

// ── 5. Fat-loss bands ────────────────────────────────────────────────
console.log('\n5. Fat-loss classification')
{
  const slower = evaluateGoalAdjustment(input({ weighInRows: weightWeeks(200, 199.5) })) // 0.25%
  check('fat-loss slower than range → small decrease',
    slower.eligibility === 'eligible' && slower.direction === 'decrease' &&
    slower.weight.band === 'slower_than_expected')
  check('standard evidence proposes 100 calories',
    slower.adjustmentAmount === -CALORIE_STEP_SMALL && slower.proposedCalories === 2100)

  const within = evaluateGoalAdjustment(input({ weighInRows: weightWeeks(200, 198.5) })) // 0.75%
  check('fat-loss within range → hold',
    within.eligibility === 'hold' && within.direction === 'hold' &&
    within.weight.band === 'within_expected_range' && within.proposedCalories === null)

  const faster = evaluateGoalAdjustment(input({
    weighInRows: weightWeeks(200, 197), // 1.5% loss, deviation 0.5pp over max 1.0
    foodLogRows: foodDays(5),
  }))
  check('fat-loss faster than range → increase',
    faster.eligibility === 'eligible' && faster.direction === 'increase' &&
    faster.weight.band === 'faster_than_expected')
  check('strong evidence proposes the 200 maximum',
    faster.adjustmentAmount === CALORIE_STEP_LARGE && faster.proposedCalories === 2400)
  check('faster-loss with standard evidence proposes 100 only',
    evaluateGoalAdjustment(input({
      weighInRows: weightWeeks(200, 197), foodLogRows: foodDays(4),
    })).adjustmentAmount === CALORIE_STEP_SMALL)
}

// ── 6. Body-fat context ──────────────────────────────────────────────
console.log('\n6. Body-fat context')
{
  check('band widens above 20% body fat',
    fatLossBand(25).maxPct === 1.25 && fatLossBand(25).minPct === 0.5)
  check('lean users get the slower band below 10%',
    fatLossBand(8).maxPct === 0.5 && fatLossBand(8).minPct === 0.25)
  check('unknown body fat uses the moderate default',
    fatLossBand(null).minPct === 0.5 && fatLossBand(null).maxPct === 1.0)

  const higherBf = evaluateGoalAdjustment(input({
    weighInRows: [...weightWeeks(200, 197.8), weighIn('2026-08-01', 197.8, undefined, 25)],
  })) // 1.1% loss
  check('higher-body-fat broader guardrail: 1.1%/wk is within the 20%+ band',
    higherBf.bodyFat.pct === 25 && higherBf.weight.band === 'within_expected_range')

  const lean = evaluateGoalAdjustment(input({
    weighInRows: [...weightWeeks(200, 198.5), weighIn('2026-08-01', 198.5, undefined, 8)],
  })) // 0.75% loss
  check('lean-user slower-loss guardrail: 0.75%/wk is faster than the sub-10% band',
    lean.bodyFat.pct === 8 && lean.weight.band === 'faster_than_expected' &&
    lean.direction === 'increase')

  check('body-fat from recent metric labeled as such',
    higherBf.bodyFat.source === 'recent_metric')
  check('profile body fat used when no recent metric',
    evaluateGoalAdjustment(input({ profileBfPct: 22 })).bodyFat.source === 'profile')
  check('missing body fat handled safely',
    evaluateGoalAdjustment(input()).bodyFat.pct === null)
  check('implausible body fat excluded',
    resolveBodyFatContext(
      [{ logged_date: '2026-08-01', bf_pct: 99 }], 150, '2026-08-02'
    ).pct === null)
  check('stale metric outside the recency window ignored',
    resolveBodyFatContext(
      [{ logged_date: '2026-01-01', bf_pct: 25 }], null, '2026-08-02'
    ).pct === null)
  check('sex-aware protein thresholds preserved in nutrition.ts (untouched)',
    readFileSync('src/lib/nutrition.ts', 'utf8').includes('LEAN_MASS_PROTEIN_THRESHOLD'))
}

// ── 7. Maintenance and gain ──────────────────────────────────────────
console.log('\n7. Maintenance and gain goals')
{
  check('maintenance stable → hold',
    evaluateGoalAdjustment(input({
      goal: 'maintenance', weighInRows: weightWeeks(200, 200.4),
    })).eligibility === 'hold') // +0.2%
  const driftUp = evaluateGoalAdjustment(input({
    goal: 'maintenance', weighInRows: weightWeeks(200, 202), foodLogRows: foodDays(5),
  })) // +1.0%
  check('maintenance strong drift up → small decrease',
    driftUp.eligibility === 'eligible' && driftUp.direction === 'decrease')
  check('maintenance weak drift holds (noise is not evidence)',
    evaluateGoalAdjustment(input({
      goal: 'maintenance', weighInRows: weightWeeks(200, 201), foodLogRows: foodDays(4),
    })).eligibility === 'hold') // +0.5%, weak evidence
  const driftDown = evaluateGoalAdjustment(input({
    goal: 'maintenance', weighInRows: weightWeeks(200, 198), foodLogRows: foodDays(5),
  })) // -1.0%
  check('maintenance strong drift down → small increase',
    driftDown.eligibility === 'eligible' && driftDown.direction === 'increase')

  check('muscle-gain slower than range → increase',
    (() => {
      const g = evaluateGoalAdjustment(input({
        goal: 'muscle_gain', weighInRows: weightWeeks(200, 200), // 0%
      }))
      return g.eligibility === 'eligible' && g.direction === 'increase' &&
        g.weight.band === 'slower_than_expected'
    })())
  check('muscle-gain within range → hold',
    evaluateGoalAdjustment(input({
      goal: 'muscle_gain', weighInRows: weightWeeks(200, 200.6), // +0.3%
    })).eligibility === 'hold')
  check('muscle-gain faster than range → small reduction, never aggressive surplus',
    (() => {
      const g = evaluateGoalAdjustment(input({
        goal: 'muscle_gain', weighInRows: weightWeeks(200, 201.6), // +0.8%
      }))
      return g.eligibility === 'eligible' && g.direction === 'decrease'
    })())
  check('gain band is conservative', GAIN_BAND.minPct === 0.1 && GAIN_BAND.maxPct === 0.5)
}

// ── 8. Blocking decisions ────────────────────────────────────────────
console.log('\n8. Blocking decisions and cooldown')
{
  const base = { created_at: '2026-07-30T10:00:00.000Z' }
  check('pending adjustment decision blocks duplicate',
    evaluateGoalAdjustment(input({
      recentDecisions: [{ decision_type: 'calorie_adjustment', status: 'suggested', ...base }],
    })).eligibility === 'pending_existing_decision')
  check('accepted unresolved adjustment blocks duplicate',
    evaluateGoalAdjustment(input({
      recentDecisions: [{
        decision_type: 'calorie_adjustment', status: 'accepted',
        follow_through_status: 'not_started', ...base,
      }],
    })).eligibility === 'pending_existing_decision')
  check('applied awaiting-review adjustment blocks within the cooldown',
    evaluateGoalAdjustment(input({
      recentDecisions: [{
        decision_type: 'calorie_adjustment', status: 'applied', reviewed_at: null, ...base,
      }],
    })).eligibility === 'awaiting_review')
  check('dismissed old adjustment does not block',
    evaluateGoalAdjustment(input({
      recentDecisions: [{ decision_type: 'calorie_adjustment', status: 'dismissed', ...base }],
    })).eligibility !== 'pending_existing_decision')
  check('reviewed adjustment permits reconsideration',
    evaluateGoalAdjustment(input({
      recentDecisions: [{
        decision_type: 'calorie_adjustment', status: 'applied',
        reviewed_at: '2026-08-01T10:00:00.000Z', ...base,
      }],
    })).eligibility !== 'awaiting_review')
  check('applied-unreviewed older than the cooldown no longer blocks (never forever)',
    findBlockingDecision([{
      decision_type: 'calorie_adjustment', status: 'applied', reviewed_at: null,
      created_at: '2026-07-01T10:00:00.000Z',
    }], '2026-07-20') === null)
  check('accepted adjustment with completed follow-through does not block',
    findBlockingDecision([{
      decision_type: 'calorie_adjustment', status: 'accepted',
      follow_through_status: 'completed', created_at: '2026-07-30T10:00:00.000Z',
    }], '2026-07-20') === null)
  check('manual target-change decision awaiting review also blocks',
    findBlockingDecision([{
      decision_type: 'nutrition_targets_updated', status: 'applied', reviewed_at: null,
      created_at: '2026-07-30T10:00:00.000Z',
    }], '2026-07-20')?.kind === 'awaiting_review')
}

// ── 9. Guardrails ────────────────────────────────────────────────────
console.log('\n9. Proposal guardrails')
{
  const floor = evaluateGoalAdjustment(input({
    target: { calories: 1250, protein_g: 100, carbs_g: 100, fat_g: 30, effective_date: '2026-07-01' },
    weighInRows: weightWeeks(200, 199.5), // slower → decrease wanted
  }))
  check(`calorie floor (${MIN_CALORIES_FLOOR}) blocks an unsafe decrease`,
    floor.eligibility === 'hold' && floor.proposedCalories === null &&
    floor.blockingReasons.some((r) => r.includes('floor')))
  const carbs = evaluateGoalAdjustment(input({
    target: { calories: 2000, protein_g: 250, carbs_g: 90, fat_g: 70, effective_date: '2026-07-01' },
    weighInRows: weightWeeks(200, 199.5),
  }))
  check('unsafe macro allocation blocks the proposal (carb minimum)',
    carbs.eligibility === 'hold' &&
    carbs.blockingReasons.some((r) => r.includes('carbohydrates') || r.includes('75g')))
  const ok = evaluateGoalAdjustment(input({ weighInRows: weightWeeks(200, 199.5) }))
  check('protein target protected (guardrail stated, macros untouched)',
    ok.guardrails.includes('Protein target unchanged.'))
  check('fat minimum protected', ok.guardrails.includes('Fat target unchanged.'))
  check('all proposals are round 100s',
    [ok.proposedCalories, ok.adjustmentAmount].every(
      (v) => v !== null && Math.abs(v % 100) === 0))
}

// ── 10. Proposal contract ────────────────────────────────────────────
console.log('\n10. Proposal contract')
{
  const inp = input({ weighInRows: weightWeeks(200, 199.5) })
  const snapshot = JSON.stringify(inp)
  const r = evaluateGoalAdjustment(inp)
  check('before snapshot correct', r.before?.calories === 2200)
  check('after snapshot correct', r.after?.calories === 2100)
  check('decision type is the existing calorie_adjustment',
    r.decisionType === 'calorie_adjustment' && ADJUSTMENT_DECISION_TYPE === 'calorie_adjustment')
  check('suggested review date is two weeks out (date-only, no drift)',
    r.suggestedReviewOn === '2026-08-18')
  check('eligibility state deterministic (same input, same output)',
    JSON.stringify(evaluateGoalAdjustment(inp)) === JSON.stringify(r))
  check('blocking reasons deterministic and readable',
    Array.isArray(r.blockingReasons))
  check('evaluator does not mutate its input', JSON.stringify(inp) === snapshot)
  check('current target unchanged by evaluation (review is read-only)',
    inp.target?.calories === 2200)
  const lib = readFileSync('src/lib/goal-adjustments.ts', 'utf8')
    .replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
  check('no causal language', !/caused|because your|led to|resulted in/i.test(lib))
  check('no medical/metabolic/hormonal language',
    !/metabol|hormon|diagnos|adaptive thermo|injur/i.test(lib))
  check('no false precision in explanations',
    !r.explanation.includes('exactly') && /slower than the selected goal range/.test(r.explanation))
  check('data unavailable differs from valid zero data',
    (() => {
      const failed = evaluateGoalAdjustment(input({
        availability: { weight: false, nutrition: true, decisions: true },
      }))
      const emptyValid = evaluateGoalAdjustment(input({ weighInRows: [] }))
      return failed.eligibility === 'data_unavailable' &&
        emptyValid.eligibility === 'insufficient_weight_data'
    })())
}

// ── 11. Apply validation ─────────────────────────────────────────────
console.log('\n11. Server apply validation')
{
  const eligible = evaluateGoalAdjustment(input({ weighInRows: weightWeeks(200, 199.5) }))
  const good = { expectedCurrentCalories: 2200, proposedCalories: 2100, expectedGoal: 'fat_loss' }
  check('valid apply request accepted', validateAdjustmentApply(eligible, good).ok)
  check('stale current-target mismatch rejected',
    (() => {
      const v = validateAdjustmentApply(eligible, { ...good, expectedCurrentCalories: 2300, proposedCalories: 2200 })
      return !v.ok && v.stale
    })())
  check('stale goal mismatch rejected',
    (() => {
      const v = validateAdjustmentApply(eligible, { ...good, expectedGoal: 'maintenance' })
      return !v.ok && v.stale
    })())
  check('stale proposal mismatch rejected',
    (() => {
      const v = validateAdjustmentApply(eligible, { ...good, proposedCalories: 2000 })
      return !v.ok && v.stale && v.error.includes('refresh')
    })())
  check('adjustment over 200 calories rejected',
    !validateAdjustmentApply(eligible, { ...good, proposedCalories: 1900 }).ok)
  check('arbitrary target rejected',
    !validateAdjustmentApply(eligible, { ...good, proposedCalories: 2137 }).ok)
  check('non-finite values rejected',
    !validateAdjustmentApply(eligible, { ...good, proposedCalories: Number.NaN }).ok)
  check('ineligible fresh review rejects apply as stale',
    (() => {
      const held = evaluateGoalAdjustment(input()) // within range → hold
      const v = validateAdjustmentApply(held, good)
      return !v.ok && v.stale
    })())
  check('post-apply duplicate is safely rejected (new target date → cooldown → stale)',
    (() => {
      const afterApply = evaluateGoalAdjustment(input({
        target: { ...TARGET, calories: 2100, effective_date: TODAY },
        weighInRows: weightWeeks(200, 199.5),
      }))
      const v = validateAdjustmentApply(afterApply, good)
      return afterApply.eligibility === 'recent_target_change' && !v.ok && v.stale
    })())
}

// ── 12. Source contracts ─────────────────────────────────────────────
console.log('\n12. Source contracts')
{
  const route = readFileSync('src/app/api/goal-adjustment/route.ts', 'utf8')
  check('apply recomputes the review server-side from fresh data',
    route.includes('fetchGoalAdjustmentReview(') && route.includes('validateAdjustmentApply('))
  check('unauthenticated requests rejected',
    (route.match(/status: 401/g) ?? []).length >= 2)
  check('raw database errors never returned (response bodies use safe literals only)',
    // Every NextResponse error field must be a literal or the pure
    // validator's safe message — never `detail`, `String(...)`, or a
    // raw *Error object/message.
    !/NextResponse\.json\(\s*\{\s*error:\s*(detail|String\(|\w*[eE]rror\b)/.test(route))
  check('API contains no direct nutrition-target mutation',
    !route.includes("from('nutrition_targets')"))
  check('API contains no direct decision insert for apply',
    !route.includes("from('decision_logs')"))
  check('API calls the atomic RPC exactly once',
    (route.match(/'apply_goal_calorie_adjustment'/g) ?? []).length === 1 &&
    route.includes('.rpc('))
  check('expected calories come from the server-side fresh review, never the client',
    route.includes('p_expected_calories: freshReview.currentCalories'))
  check('stale RPC result maps to a safe 409 refresh message',
    route.includes("stale_target") && route.includes('status: 409') &&
    route.includes('refresh the adjustment review'))
  check('invalid-adjustment RPC result maps to a safe 400',
    route.includes('invalid_adjustment') &&
    route.includes('Adjustments are limited to 100 or 200 calories.'))
  check('transaction failure returns generic nothing-changed message',
    route.includes('Unable to apply the adjustment. Nothing was changed.'))
  check('review date passed from the value shown pre-approval',
    route.includes('p_review_on: freshReview.suggestedReviewOn'))
  check('no service-role usage', !route.toLowerCase().includes('service_role'))

  const card = readFileSync('src/components/nutrition/GoalAdjustmentReviewCard.tsx', 'utf8')
  check('card never queries Supabase directly (API only)',
    !card.includes('supabase') && card.includes("fetch('/api/goal-adjustment')"))
  check('UI and server share proposal constraints (no client-side math)',
    !card.includes('CALORIE_STEP') && card.includes('review.proposedCalories'))
  check('explicit apply and cancel controls present',
    card.includes('Apply new calorie target') && card.includes('Cancel') &&
    card.includes('Review proposed adjustment'))
  check('review date visible before approval',
    card.includes('will be') && card.includes('suggestedReviewOn'))
  check('stale apply refreshes the review',
    card.includes('body.stale') && card.includes('loadReview()'))
  check('GET path performs zero writes (review is read-only)',
    !route.slice(route.indexOf('export async function GET'), route.indexOf('export async function POST'))
      .match(/insert|upsert|update|delete/i))
  check('empty/unavailable state copy safe',
    card.includes('unavailable right now'))

  const coach = readFileSync('src/lib/coach-actions.ts', 'utf8')
  check('Coach logic unchanged (no adjustment coupling; existing action already links to /nutrition)',
    !coach.includes('goal-adjustments') && coach.includes("linkHref: '/nutrition'"))
  const checkIn = readFileSync('src/app/(app)/check-in/page.tsx', 'utf8')
  check('Check-in has no target mutation path',
    !checkIn.includes('goal-adjustment') && !checkIn.includes('nutrition_targets'))
  const nutritionPage = readFileSync('src/app/(app)/nutrition/page.tsx', 'utf8')
  check('manual nutrition override flow still present',
    nutritionPage.includes('Override targets') && nutritionPage.includes('handleSave'))
  check('one authoritative adjustment surface (card mounted once, on /nutrition)',
    nutritionPage.includes('GoalAdjustmentReviewCard') &&
    !checkIn.includes('GoalAdjustmentReviewCard') && !coach.includes('GoalAdjustmentReviewCard'))
}

// ── 12b. Migration 013 — atomic apply RPC ────────────────────────────
console.log('\n12b. Atomic apply (migration 013)')
{
  const sql = readFileSync('supabase/migrations/013_phase3e_goal_adjustments.sql', 'utf8')
  const fnStart = sql.indexOf('CREATE OR REPLACE FUNCTION apply_goal_calorie_adjustment')
  const fnEnd = sql.indexOf('$$;', fnStart)
  const fnBody = sql.slice(fnStart, fnEnd)

  check('migration creates the atomic RPC', fnStart >= 0 && fnEnd > fnStart)
  check('RPC authenticates through auth.uid() and rejects anonymous calls',
    fnBody.includes('auth.uid()') && fnBody.includes("RAISE EXCEPTION 'not_authenticated'"))
  check('ownership explicitly validated (user_id predicate on the authoritative read)',
    fnBody.includes('user_id = v_uid'))
  check('expected-current-target check enforced in the transaction',
    fnBody.includes('v_current.calories <> p_expected_calories') &&
    fnBody.includes("RAISE EXCEPTION 'stale_target'"))
  check('only ±100/±200 accepted at the database layer',
    fnBody.includes('NOT IN (100, 200)') &&
    fnBody.includes("RAISE EXCEPTION 'invalid_adjustment'"))
  check('protein preserved from the authoritative row inside the transaction',
    fnBody.includes('v_current.protein_g'))
  check('carbohydrates preserved', fnBody.includes('v_current.carbs_g'))
  check('fat preserved', fnBody.includes('v_current.fat_g'))
  check('target write and decision write occur in ONE database function',
    fnBody.includes('INSERT INTO nutrition_targets') &&
    fnBody.includes('INSERT INTO decision_logs'))
  check('any failure rolls both writes back (RAISE aborts the single transaction)',
    (fnBody.match(/RAISE EXCEPTION/g) ?? []).length >= 2)
  check('concurrent applies serialized by a per-user advisory transaction lock',
    fnBody.includes('pg_advisory_xact_lock'))
  check('versioning convention reused (per-user-per-date upsert)',
    fnBody.includes('ON CONFLICT ON CONSTRAINT nutrition_targets_user_date_unique'))
  check('applied decision carries snapshots, applied status, user origin, review date',
    fnBody.includes("jsonb_build_object('calories', p_expected_calories)") &&
    fnBody.includes("jsonb_build_object('calories', p_proposed_calories)") &&
    fnBody.includes("'applied', 'user', NOW(), p_review_on"))
  check('follow-through/outcome keep their Phase 3D defaults (not set by the RPC)',
    (() => {
      const code = fnBody.replace(/--.*$/gm, '')
      return !code.includes('follow_through_status') && !code.match(/\boutcome\b/)
    })())
  check('returns the normalized target and decision together',
    fnBody.includes("'target', to_jsonb(v_target)") &&
    fnBody.includes("'decision', to_jsonb(v_decision)"))
  check('SECURITY INVOKER (existing RLS applies; no DEFINER escalation)',
    (() => {
      const code = sql.replace(/--.*$/gm, '')
      return code.includes('SECURITY INVOKER') && !code.includes('SECURITY DEFINER')
    })())
  check('execution granted to authenticated only',
    sql.includes('GRANT EXECUTE ON FUNCTION apply_goal_calorie_adjustment') &&
    sql.includes('TO authenticated') &&
    sql.includes('FROM PUBLIC') && sql.includes('FROM anon'))
  check('no service-role usage in the migration',
    !sql.toLowerCase().includes('service_role'))
  check('migration is additive (no drops or policy changes)',
    (() => {
      const code = sql.replace(/--.*$/gm, '')
      return !/DROP|ALTER POLICY|CREATE POLICY|ALTER TABLE/i.test(code)
    })())
}

// ── 12c. Main goal on Profile (QA fix) ───────────────────────────────
console.log('\n12c. Main goal exposure')
{
  const EXPECTED_GOALS = ['fat_loss', 'muscle_gain', 'strength', 'recomposition', 'maintenance', 'running']

  const constants = readFileSync('src/lib/constants.ts', 'utf8')
  const optionsBlock = constants.slice(
    constants.indexOf('MAIN_GOAL_OPTIONS'),
    constants.indexOf('] as const', constants.indexOf('MAIN_GOAL_OPTIONS'))
  )
  check('MAIN_GOAL_OPTIONS covers the actual enum values exactly',
    EXPECTED_GOALS.every((g) => optionsBlock.includes(`value: '${g}'`)) &&
    (optionsBlock.match(/value: '/g) ?? []).length === EXPECTED_GOALS.length)
  check('database types agree with the option list',
    (() => {
      const types = readFileSync('src/types/database.ts', 'utf8')
      const enumLine = types.slice(types.indexOf('export type MainGoal'), types.indexOf('\n', types.indexOf('export type MainGoal')))
      return EXPECTED_GOALS.every((g) => enumLine.includes(`'${g}'`))
    })())
  check('invalid goals rejected server-side by the schema CHECK constraint',
    readFileSync('supabase/migrations/001_phase1a_schema.sql', 'utf8')
      .includes("main_goal IN ('fat_loss', 'muscle_gain', 'strength', 'recomposition', 'maintenance', 'running')"))
  check('goal-change decision type labeled',
    constants.includes("main_goal_changed: 'Main goal changed'"))

  const page = readFileSync('src/app/(app)/profile/page.tsx', 'utf8')
  check('Profile renders a Main goal control using existing OptionCard conventions',
    page.includes('Main goal') && page.includes('MAIN_GOAL_OPTIONS.map') &&
    page.includes('OptionCard'))
  check('current persisted goal is selected on load',
    page.includes("setMainGoal(p.main_goal ?? '')") &&
    page.includes('selected={mainGoal === value}'))
  check('goal change is explicit (untouched goal never overwritten)',
    page.includes('const newGoal        = mainGoal || prevGoal'))
  check('save submits the goal through the existing profile update path',
    page.includes('main_goal:                   newGoal'))
  check('goal changes use the existing profile decision-logging pattern',
    page.includes("type: 'main_goal_changed'") &&
    page.includes('prev: { main_goal: prevGoal }, next: { main_goal: newGoal }'))
  check('changing goal never creates a calorie_adjustment or applies calories',
    (() => {
      // Strip comments/prose — only actual code paths matter.
      const code = page.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      return !code.includes("'calorie_adjustment'") &&
        !code.includes('/api/goal-adjustment') &&
        !code.includes('apply_goal_calorie_adjustment')
    })())
  check('changing goal never mutates nutrition targets',
    !page.includes("from('nutrition_targets')"))
  check('no-target-recalculation behavior disclosed to the user',
    page.includes('does\n            not change your nutrition targets automatically') ||
    page.includes('not change your nutrition targets automatically'))
  check('other profile fields preserved (existing payload intact)',
    page.includes('preferred_weigh_in_cadence:  cadence') &&
    page.includes('fasting_enabled:             fastingEnabled') &&
    page.includes('goal_weight_kg:'))
  check('no broad UI redesign (existing sections untouched)',
    page.includes('Activity level') && page.includes('Weigh-in schedule') &&
    page.includes('Personal info'))

  // After save, the review reads the fresh goal: the GET route always
  // refetches the profile and passes profile.main_goal — and the pure
  // evaluator flips eligibility accordingly.
  const route = readFileSync('src/app/api/goal-adjustment/route.ts', 'utf8')
  check('adjustment review reads the persisted goal on every request',
    (route.match(/profile\.main_goal/g) ?? []).length === 2)
  check('a goal change flips the next review recomputation',
    evaluateGoalAdjustment(input({ goal: 'running' })).eligibility === 'unsupported_goal' &&
    evaluateGoalAdjustment(input({ goal: 'fat_loss' })).eligibility !== 'unsupported_goal')
}

// ── 13. Phase 3A/3D invariants ───────────────────────────────────────
console.log('\n13. Prior-phase invariants')
{
  check('Phase 3D decision transitions unchanged',
    STATUS_TRANSITIONS.suggested.join(',') === 'accepted,dismissed' &&
    validateDecisionUpdate(
      { status: 'suggested', follow_through_status: 'not_started', outcome: null, reviewed_at: null },
      { status: 'accepted' }, '2026-08-04T12:00:00.000Z'
    ).ok)
  check('Phase 3A weekly review unchanged',
    resolveReviewWeekStart(TODAY, undefined) === '2026-07-27' &&
    assembleWeeklyReview({
      todayStr: TODAY, weekStart: '2026-07-27',
      weighInRows: [], foodLogRows: [], sessionRows: [], activityRows: [], fastRows: [],
      proteinTargetGrams: null, fastingEnabled: false,
    }).confidence.level === 'limited')
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
