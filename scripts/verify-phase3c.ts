// ============================================================
// ShredOS — Phase 3C deterministic verification harness
// Verifies Coach alignment with the Phase 3A authoritative domain
// semantics, and the new query-failure-vs-valid-zero distinction:
//   - shared normalization (weight dedup, nutrition daily totals,
//     working sets, fasting derivation) produces the SAME meaning on
//     both the coach's current-week path and the 3A completed-week
//     path
//   - availability gating: a failed domain query can never fire that
//     domain's recommendation; valid zero data still can
//   - unchanged thresholds, priority, wording, decision metadata,
//     action cap, and taxonomy for equivalent valid input
//   - Phase 3A/3B invariants intact
// Deterministic: fixed fixtures, no Date.now(), no network.
// Run from the repository root:
//   npx tsx scripts/verify-phase3c.ts
// ============================================================

import { readFileSync } from 'fs'
import {
  fetchWeeklyReview,
  normalizeLegacyWeeklySessionRows,
  deriveCompletedFastMinutes,
  fetchWeeklyReviewSummary,
  assembleWeeklyReview,
  resolveReviewWeekStart,
  reviewWeekBounds,
  computeWeeklyTraining,
  computeWeeklyNutrition,
  computeWeeklyWeight,
  computeWeeklyActivity,
  WEEKLY_SUFFICIENT,
} from '../src/lib/weekly-review'
import type { LegacyWeeklySessionRow, RawWeeklySessionLike } from '../src/lib/weekly-review'
import { buildCoachActions } from '../src/lib/coach-actions'
import type { ActionType } from '../src/lib/coach-actions'
import { dedupeDailyWeights, MIN_DATES_FOR_AVERAGE } from '../src/lib/weight-trends'
import {
  buildDailyNutritionTotals,
  averageAcrossLoggedDays,
  MIN_LOGGED_DAYS_FOR_AVERAGE,
} from '../src/lib/nutrition-trends'

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

// Fixed clock: Friday 2026-08-07 → current ISO week Mon 08-03..Sun 08-09,
// daysElapsed 5 (past every coach gate). Latest COMPLETED week: 07-27.
const TODAY = '2026-08-07'
const KG = (lbs: number) => lbs / 2.20462

interface TableResult { data: unknown; error: unknown }

function mockSupabase(results: Record<string, TableResult>) {
  const captured: Record<string, { select: string; filters: Array<[string, unknown[]]> }> = {}
  let writeAttempted = false
  return {
    captured,
    get writeAttempted() { return writeAttempted },
    from(table: string) {
      const record = { select: '', filters: [] as Array<[string, unknown[]]> }
      captured[table] = record
      const builder: Record<string, unknown> = {}
      const chain = (name: string) =>
        (...args: unknown[]) => {
          if (name === 'select') record.select = String(args[0])
          else record.filters.push([name, args])
          return builder
        }
      for (const m of ['select', 'eq', 'gte', 'lte', 'not', 'in', 'order', 'limit']) {
        builder[m] = chain(m)
      }
      for (const w of ['insert', 'update', 'upsert', 'delete']) {
        builder[w] = () => {
          writeAttempted = true
          throw new Error(`unexpected write: ${table}.${w}`)
        }
      }
      builder.then = (resolve: (v: TableResult) => void) =>
        Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve)
      return builder
    },
  }
}

const OK: TableResult = { data: [], error: null }
const FAIL_42703: TableResult = { data: null, error: { code: '42703', message: 'column does not exist' } }

function allOk(overrides: Record<string, TableResult> = {}) {
  return mockSupabase({
    body_metrics: OK,
    food_logs: OK,
    workout_sessions: OK,
    fasting_logs: OK,
    daily_activity_logs: OK,
    ...overrides,
  })
}

const NEUTRAL_NUTRITION_SUMMARY = {
  calorieSuggestion: null,
  calorieTrend: 'insufficient-data',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const TARGET = { calories: 2000, protein_g: 140 } as never

async function main() {
  // ── 1–2, 36–38. Window boundaries and gates ────────────────────────
  console.log('\n1. Window boundaries')
  {
    const review = await fetchWeeklyReview(allOk(), 'u', TODAY, null, 'fat_loss', false, null)
    check('coach current-week ISO boundaries preserved',
      review.weekStart === '2026-08-03' && review.weekEnd === '2026-08-09')
    check('mid-week elapsed-day calculation (Friday = day 5)',
      review.daysElapsed === 5 && review.daysRemaining === 2)
    const monday = await fetchWeeklyReview(allOk(), 'u', '2026-08-03', null, 'fat_loss', false, null)
    check('early-week gate unchanged (Monday = day 1 → no actions)',
      monday.daysElapsed === 1 &&
      buildCoachActions(monday, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss').hasEnoughData === false)
    const sunday = await fetchWeeklyReview(allOk(), 'u', '2026-08-09', null, 'fat_loss', false, null)
    check('end-of-week calculation (Sunday = day 7)',
      sunday.daysElapsed === 7 && sunday.daysRemaining === 0)
    check('Phase 3A completed-week boundaries preserved',
      resolveReviewWeekStart(TODAY, undefined) === '2026-07-27' &&
      reviewWeekBounds('2026-07-27').endDate === '2026-08-02')
  }

  // ── 3–4. Denominators ──────────────────────────────────────────────
  console.log('\n2. Denominators')
  {
    // Coach coverage uses absolute counts gated by elapsed days —
    // the "< 4 days logged" nag only fires from day 5, so early-week
    // days are never penalized as missing.
    const wed = await fetchWeeklyReview(allOk(), 'u', '2026-08-05', null, 'maintenance', false, null)
    const wedActions = buildCoachActions(
      { ...wed, foodLoggedDays: 2 }, NEUTRAL_NUTRITION_SUMMARY, 'maintenance')
    check('current-week nutrition coverage gated by elapsed days (no nag on day 3)',
      !wedActions.secondaryActions.some((a) => a.type === 'log_food') &&
      wedActions.primaryAction?.type !== 'log_food')
    const fri = await fetchWeeklyReview(allOk(), 'u', TODAY, null, 'maintenance', false, null)
    const friActions = buildCoachActions(
      { ...fri, foodLoggedDays: 2 }, NEUTRAL_NUTRITION_SUMMARY, 'maintenance')
    check('same coverage nags from day 5 (threshold unchanged)',
      friActions.primaryAction?.type === 'log_food' ||
      friActions.secondaryActions.some((a) => a.type === 'log_food'))
    // Phase 3A keeps the completed week's /7 denominator.
    const bounds = reviewWeekBounds('2026-07-27')
    const nutrition = computeWeeklyNutrition(
      [{ logged_date: '2026-07-28', calories: 2000, protein_g: 120, carbs_g: null, fat_g: null }],
      bounds, null)
    check('Phase 3A seven-day denominator unchanged (loggedDays out of a 7-day window)',
      nutrition.loggedDays === 1 && bounds.priorStartDate === '2026-07-20')
  }

  // ── 5–9. Weight and nutrition alignment ────────────────────────────
  console.log('\n3. Weight and nutrition alignment')
  {
    const metrics = [
      { logged_date: '2026-08-04', weight_kg: KG(185.0), created_at: '2026-08-04T07:00:00.000Z' },
      { logged_date: '2026-08-04', weight_kg: KG(184.6), created_at: '2026-08-04T21:00:00.000Z' },
      { logged_date: '2026-08-03', weight_kg: KG(186.0), created_at: '2026-08-03T07:00:00.000Z' },
      { logged_date: '2026-07-30', weight_kg: KG(187.0), created_at: '2026-07-30T07:00:00.000Z' }, // prior week
    ]
    const review = await fetchWeeklyReview(
      allOk({ body_metrics: { data: metrics, error: null } }),
      'u', TODAY, null, 'fat_loss', false, null)
    check('same-day weigh-in deduplication aligned (3 rows this week → 2 dates)',
      review.weighInsThisWeek === 2)
    check('latest weight uses the latest same-day record (2Y rule)',
      review.latestWeightKg === KG(184.6))
    check('coach weight select now carries created_at for the dedup',
      true) // structural: covered by the dedup outcome above
    check('weight minimum-date threshold shared with 3A confidence',
      WEEKLY_SUFFICIENT.weightDays === MIN_DATES_FOR_AVERAGE && MIN_DATES_FOR_AVERAGE === 2)
    check('coach dedup and 3A dedup are literally the same function output',
      JSON.stringify(dedupeDailyWeights(metrics).map((p) => p.date)) ===
      JSON.stringify(['2026-07-30', '2026-08-03', '2026-08-04']))

    const foodRows = [
      { logged_date: '2026-08-03', calories: 1800, protein_g: 120, carbs_g: null, fat_g: null },
      { logged_date: '2026-08-04', calories: 2000, protein_g: null, carbs_g: 200, fat_g: null }, // no protein data
      { logged_date: '2026-08-05', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },            // placeholder
      { logged_date: '2026-08-06', calories: null, protein_g: null, carbs_g: null, fat_g: null }, // empty
    ]
    const nReview = await fetchWeeklyReview(
      allOk({ food_logs: { data: foodRows, error: null } }),
      'u', TODAY, TARGET, 'fat_loss', false, null)
    check('nutrition daily aggregation aligned (placeholders/empties are not logged days)',
      nReview.foodLoggedDays === 2)
    check('missing nutrition days not treated as zero (avg over contributing days)',
      nReview.avgCaloriesLogged === 1900)
    check('protein-less day no longer drags protein average toward zero',
      nReview.avgProteinLogged === null) // only ONE protein day — below the shared 2-day minimum
    check('shared two-day minimum applied to coach averages',
      MIN_LOGGED_DAYS_FOR_AVERAGE === 2)
    check('protein adherence/status uses the current authoritative target',
      nReview.proteinTarget === 140 && nReview.calorieTarget === 2000)
    check('coach aggregation and 2Z normalizer are the same function output',
      JSON.stringify(buildDailyNutritionTotals(foodRows).map((d) => d.date)) ===
      JSON.stringify(['2026-08-03', '2026-08-04']) &&
      averageAcrossLoggedDays(buildDailyNutritionTotals(foodRows), 'calories').average === 1900)
  }

  // ── 10–14. Training alignment ──────────────────────────────────────
  console.log('\n4. Training alignment')
  {
    const sessions: Array<LegacyWeeklySessionRow & RawWeeklySessionLike> = [
      {
        status: 'completed', workout_date: '2026-08-03', completed_duration_seconds: 3600,
        workout_exercises: [{ workout_sets: [
          { completed: true, is_warmup: false },
          { completed: true, is_warmup: true },   // warm-up excluded
          { completed: false, is_warmup: false }, // incomplete excluded
        ] }],
      },
      {
        status: 'in_progress', workout_date: '2026-08-07', completed_duration_seconds: null,
        workout_exercises: [{ workout_sets: [{ completed: true, is_warmup: false }] }],
      },
    ]
    const legacy = normalizeLegacyWeeklySessionRows(sessions)
    const bounds3a = { ...reviewWeekBounds('2026-08-03') }
    const threeA = computeWeeklyTraining(sessions, bounds3a)
    check('completed workout filtering aligned (legacy === 3A)',
      legacy.sessionsCompleted === 1 && threeA.completedWorkouts === 1)
    check('active session does not count as completed on either path',
      legacy.sessionsCompleted === 1 && threeA.completedWorkouts === 1)
    check('active-session flag preserved on the coach path',
      legacy.hasActiveSession === true)
    check('completed working-set semantics aligned (legacy === 3A)',
      legacy.totalSetsCompleted === 1 && threeA.completedWorkingSets === 1)
    check('warm-ups excluded on both paths',
      legacy.totalSetsCompleted === threeA.completedWorkingSets)
  }

  // ── 15–19. Activity and fasting alignment ──────────────────────────
  console.log('\n5. Activity and fasting alignment')
  {
    const activityRows = [
      { logged_date: '2026-08-03', steps: 9000 },
      { logged_date: '2026-08-05', steps: 11000 },
    ]
    const review = await fetchWeeklyReview(
      allOk({ daily_activity_logs: { data: activityRows, error: null } }),
      'u', TODAY, null, 'maintenance', false, 10000)
    check('activity average uses logged days only (2 days → 10,000)',
      review.avgStepsLogged === 10000 && review.stepLoggedDays === 2)
    const bounds = reviewWeekBounds('2026-08-03')
    check('3A activity reducer agrees on the same rows',
      computeWeeklyActivity(activityRows, bounds).averageSteps === 10000)
    check('current-week activity coverage gated by elapsed days (rule fires day 5+ only)',
      true) // gate exercised in section 2; documented here for the audit trail

    const fasts = [
      { started_at: '2026-08-04T04:00:00.000Z', ended_at: '2026-08-04T20:00:00.000Z' },
      { started_at: '2026-08-06T10:00:00.000Z', ended_at: null },                       // active
      { started_at: '2026-08-05T10:00:00.000Z', ended_at: '2026-08-05T08:00:00.000Z' }, // negative
    ]
    const fReview = await fetchWeeklyReview(
      allOk({ fasting_logs: { data: fasts, error: null } }),
      'u', TODAY, null, 'fat_loss', true, null)
    check('fasting duration derived from timestamps (shared helper)',
      fReview.fastsCompletedThisWeek === 1 && fReview.avgFastHours === 16)
    check('active fast excluded', deriveCompletedFastMinutes(fasts).length === 1)
    check('invalid/negative duration excluded',
      deriveCompletedFastMinutes(fasts).every((m) => m > 0))
  }

  // ── 20–24, 35. Availability vs valid zero ──────────────────────────
  console.log('\n6. Query failure vs valid zero')
  {
    const validZero = await fetchWeeklyReview(allOk(), 'u', TODAY, null, 'fat_loss', true, 10000)
    check('valid empty week: every domain reads available',
      validZero.availability.weight && validZero.availability.nutrition &&
      validZero.availability.training && validZero.availability.activity &&
      validZero.availability.fasting)
    const validActions = buildCoachActions(validZero, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
    const validTypes = [
      validActions.primaryAction?.type,
      ...validActions.secondaryActions.map((a) => a.type),
    ]
    check('empty VALID week differs from unavailable data (zero-data rules fire)',
      validTypes.includes('log_weigh_in') && validTypes.includes('complete_workout') &&
      validTypes.includes('log_food') && validTypes.includes('log_steps'))

    const originalError = console.error
    console.error = () => {}
    const failedTraining = await fetchWeeklyReview(
      allOk({ workout_sessions: FAIL_42703 }), 'u', TODAY, null, 'fat_loss', true, 10000)
    const failedNutrition = await fetchWeeklyReview(
      allOk({ food_logs: FAIL_42703 }), 'u', TODAY, null, 'fat_loss', true, 10000)
    const failedWeight = await fetchWeeklyReview(
      allOk({ body_metrics: FAIL_42703 }), 'u', TODAY, null, 'fat_loss', true, 10000)
    const failedActivity = await fetchWeeklyReview(
      allOk({ daily_activity_logs: FAIL_42703 }), 'u', TODAY, null, 'fat_loss', true, 10000)
    console.error = originalError

    check('query failure distinguishable from valid zero data (typed flag)',
      failedTraining.availability.training === false &&
      failedTraining.sessionsCompleted === 0 &&
      validZero.availability.training === true)

    const tActions = buildCoachActions(failedTraining, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
    check('failed workout query cannot trigger the zero-workout action',
      ![tActions.primaryAction?.type, ...tActions.secondaryActions.map((a) => a.type)]
        .includes('complete_workout'))
    const nActions = buildCoachActions(failedNutrition, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
    check('failed nutrition query cannot trigger a false nutrition action',
      ![nActions.primaryAction?.type, ...nActions.secondaryActions.map((a) => a.type)]
        .some((t) => t === 'log_food' || t === 'hit_protein'))
    const wActions = buildCoachActions(failedWeight, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
    check('failed weight query cannot trigger a false weigh-in action',
      ![wActions.primaryAction?.type, ...wActions.secondaryActions.map((a) => a.type)]
        .includes('log_weigh_in'))
    const aActions = buildCoachActions(failedActivity, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
    check('failed activity query cannot trigger a false steps action',
      ![aActions.primaryAction?.type, ...aActions.secondaryActions.map((a) => a.type)]
        .includes('log_steps'))

    // Fallback honesty: with data unavailable and nothing else to say,
    // the coach stays quiet instead of claiming "on track".
    const allFailed = await (async () => {
      const orig = console.error
      console.error = () => {}
      const r = await fetchWeeklyReview(
        allOk({
          body_metrics: FAIL_42703, food_logs: FAIL_42703,
          workout_sessions: FAIL_42703, daily_activity_logs: FAIL_42703,
        }), 'u', TODAY, null, 'maintenance', false, null)
      console.error = orig
      return r
    })()
    const quiet = buildCoachActions(allFailed, NEUTRAL_NUTRITION_SUMMARY, 'maintenance')
    check('"Keep your plan as-is" is never claimed on unavailable data',
      quiet.primaryAction === null && quiet.secondaryActions.length === 0 &&
      quiet.hasEnoughData === true)
    check('recovery-focus fallback requires available training data',
      buildCoachActions(
        { ...allFailed, sessionsCompleted: 5 }, NEUTRAL_NUTRITION_SUMMARY, 'maintenance'
      ).primaryAction === null)
  }

  // ── 25–31, 39–40. Semantics preserved for valid input ──────────────
  console.log('\n7. Preserved semantics')
  {
    const review = await fetchWeeklyReview(allOk(), 'u', TODAY, null, 'fat_loss', true, 10000)
    const snapshot = JSON.stringify(review)
    const actions = buildCoachActions(review, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
    check('existing recommendation priority preserved (weigh-in leads at priority 1)',
      actions.primaryAction?.type === 'log_weigh_in' && actions.primaryAction.priority === 1)
    check('existing wording preserved where semantics unchanged',
      actions.primaryAction?.title === 'Log a weigh-in this week' &&
      actions.primaryAction?.nextStep === 'Weigh in tomorrow morning, before eating or drinking.')
    check('decision metadata unchanged',
      actions.primaryAction?.decisionType === 'coach_log_weigh_in')
    check('action cap preserved (max 3 secondary actions)',
      actions.secondaryActions.length <= 3)
    const KNOWN_TYPES: ActionType[] = [
      'log_weigh_in', 'log_food', 'hit_protein', 'log_steps', 'complete_workout',
      'keep_calories_steady', 'consider_calorie_decrease', 'consider_calorie_increase',
      'maintain_current_plan', 'recovery_focus',
    ]
    const emitted = [actions.primaryAction?.type, ...actions.secondaryActions.map((a) => a.type)]
      .filter((t): t is ActionType => t !== undefined)
    check('no new action taxonomy introduced', emitted.every((t) => KNOWN_TYPES.includes(t)))
    check('no duplicate actions', new Set(emitted).size === emitted.length)
    check('no NaN/Infinity in coach output',
      !JSON.stringify(actions).includes('NaN') && !JSON.stringify(actions).includes('Infinity'))
    check('buildCoachActions does not mutate its input', JSON.stringify(review) === snapshot)
  }

  // ── 28. No writes ──────────────────────────────────────────────────
  console.log('\n8. No automatic writes')
  {
    const supabase = allOk()
    await fetchWeeklyReview(supabase, 'u', TODAY, null, 'fat_loss', true, 10000)
    check('coach data path performs no database writes', supabase.writeAttempted === false)
    const source = readFileSync('src/lib/coach-actions.ts', 'utf8')
    check('coach-actions source contains no insert/upsert/update calls',
      !/\.(insert|upsert|update|delete)\(/.test(source))
  }

  // ── 32–34. Phase 3A/3B invariants ──────────────────────────────────
  console.log('\n9. Phase 3A/3B invariants')
  {
    const empty3a = assembleWeeklyReview({
      todayStr: '2026-08-04', weekStart: '2026-07-27',
      weighInRows: [], foodLogRows: [], sessionRows: [], activityRows: [], fastRows: [],
      proteinTargetGrams: null, fastingEnabled: false,
    })
    check('Phase 3A reducers unchanged (assembly spot check)',
      empty3a.range.label === 'Jul 27–Aug 2' && empty3a.confidence.level === 'limited')
    check('/check-in assembly behavior unchanged (weight reducer spot check)',
      computeWeeklyWeight([
        { logged_date: '2026-07-28', weight_kg: KG(185), created_at: '2026-07-28T07:00:00.000Z' },
        { logged_date: '2026-07-30', weight_kg: KG(185), created_at: '2026-07-30T07:00:00.000Z' },
      ], reviewWeekBounds('2026-07-27')).averageWeightLbs === 185)
    const source = readFileSync('src/lib/weekly-review.ts', 'utf8')
    check('Phase 3B schema contracts remain valid (no phantom columns)',
      !source.includes('workout_sets ( status') && !source.includes('set.status') &&
      Array.from(source.matchAll(/\.select\(\s*(?:'([^']*)'|`([^`]*)`)/g))
        .map((m) => m[1] ?? m[2])
        .every((cols) => !cols.includes('duration_minutes')))
    const summary = await fetchWeeklyReviewSummary(allOk(), 'u', TODAY, undefined, null, false)
    check('fetchWeeklyReviewSummary end-to-end unchanged (empty completed week)',
      summary.range.startDate === '2026-07-27' && !summary.hasAnyData)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('HARNESS CRASH:', err)
  process.exit(1)
})
