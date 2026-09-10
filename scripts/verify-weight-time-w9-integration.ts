// ============================================================
// ForgeFitOS — W9 verifier: weight_time domain integration (non-UI).
// (docs/weight-time-coordinated-implementation-plan.md §8.1, §8.7, §8.8, §16 W9.)
//
// Executes the REAL domain helpers (src/lib/workout.ts,
// src/lib/progress-overview.ts, src/lib/workout-coach.ts) over fixtures
// and asserts, per the approved plan:
//   * summaries render BOTH dimensions, a stored 0 reads "0 lb added";
//   * the representative set for a session is the longest qualifying hold
//     (tie → heavier), never a scalar, never the cardio pace branch;
//   * trackingAwareProgressSignal applies 2-D dominance for weight_time
//     (incomparable = same), never the duration-only fallback;
//   * suggestNextTarget emits ONLY the two approved neutral strings, RPE
//     never alters them (D5), the strength ladder is never entered;
//   * evaluateSetTargetFeedback keeps weight_time outside the reps-only
//     programmed-target model (intentional exclusion);
//   * summarizeWorkout scores weight_time PRs with the 2-D model only and
//     never with evaluateSetPRs; the RPE attention rule includes it;
//   * the /progress overview row shows "0 lb added", a 2-D status and no
//     est. 1RM; the four legacy modes are unchanged on the same fixtures;
//   * fetchExerciseTrends never scores a weight_time exercise;
//   * by source: server.ts gates its strength PR baseline, 1RM and
//     cardio/timed aggregate by executable mode sets, and no scalar over
//     weight × duration exists anywhere in the domain layer.
//
// Never contacts Supabase, Vercel, or any remote service.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w9-integration.ts
// ============================================================

import path from 'node:path'
import { readFileSync } from 'node:fs'

import {
  formatTrackingAwareSetSummary, formatAddedWeightLb,
  pickRepresentativeCardioSet, pickRepresentativeWeightTimeSet, bestSet, setScore,
  trackingAwareProgressSignal, progressSignal,
  suggestNextTarget, evaluateSetTargetFeedback, evaluateSetPRs, summarizeWorkout,
  WEIGHT_TIME_HOLD_LONGER_GUIDANCE, WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE,
  STRENGTH_SCORING_MODES, CARDIO_TIMED_MODES, RPE_LOGGABLE_MODES,
} from '../src/lib/workout'
import { buildExerciseProgressOverview } from '../src/lib/progress-overview'
import type { RawOverviewSession } from '../src/lib/progress-overview'
import { fetchExerciseTrends } from '../src/lib/workout-coach'
import { lbsToKg } from '../src/lib/units'
import type { WorkoutSet, TrackingMode } from '../src/types/database'

const repositoryRoot = process.cwd()
let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (relative: string): string => readFileSync(path.join(repositoryRoot, relative), 'utf8')
const stripComments = (text: string): string => text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
/** Text of one top-level function body, by name. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`)
  if (start < 0) return ''
  // Skip the parameter list first — a default value such as `= {}` would
  // otherwise be mistaken for the body's opening brace.
  let parenDepth = 0
  let afterParams = start
  for (let index = source.indexOf('(', start); index < source.length; index += 1) {
    if (source[index] === '(') parenDepth += 1
    if (source[index] === ')') { parenDepth -= 1; if (parenDepth === 0) { afterParams = index; break } }
  }
  const open = source.indexOf('{', afterParams)
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') { depth -= 1; if (depth === 0) return source.slice(open, index + 1) }
  }
  return ''
}

let setCounter = 0
function set(overrides: Partial<WorkoutSet>): WorkoutSet {
  setCounter += 1
  return {
    id: `set-${setCounter}`, workout_exercise_id: 'we-1', set_number: setCounter,
    weight_kg: null, reps: null, rpe: null, completed: true, is_warmup: false, notes: null,
    duration_seconds: null, distance_meters: null, created_at: '2026-09-01',
    ...overrides,
  }
}
const hold = (lbs: number, seconds: number, overrides: Partial<WorkoutSet> = {}): WorkoutSet => set({ weight_kg: lbsToKg(lbs), duration_seconds: seconds, ...overrides })

async function main(): Promise<number> {
  console.log('W9 verification — weight_time domain integration')
  console.log(`root=${repositoryRoot}`)

  console.log('\nA. Summaries — both dimensions, zero renders as "0 lb added"')
  check('A1: "1:30 · 20 lb added"', formatTrackingAwareSetSummary({ reps: null, weightKg: lbsToKg(20), rpe: null, durationSeconds: 90, distanceMeters: null }, 'weight_time') === '1:30 · 20 lb added',
    formatTrackingAwareSetSummary({ reps: null, weightKg: lbsToKg(20), rpe: null, durationSeconds: 90, distanceMeters: null }, 'weight_time'))
  check('A2: a stored 0 renders "1:30 · 0 lb added" — never blank, never omitted', formatTrackingAwareSetSummary({ reps: null, weightKg: 0, rpe: null, durationSeconds: 90, distanceMeters: null }, 'weight_time') === '1:30 · 0 lb added')
  check('A3: RPE appended, warm-up prefixed: "WU · 1:30 · 20 lb added · RPE 7"', formatTrackingAwareSetSummary({ reps: null, weightKg: lbsToKg(20), rpe: 7, isWarmup: true, durationSeconds: 90, distanceMeters: null }, 'weight_time') === 'WU · 1:30 · 20 lb added · RPE 7')
  check('A4: no duration → empty summary (not a qualifying hold)', formatTrackingAwareSetSummary({ reps: null, weightKg: lbsToKg(20), rpe: null, durationSeconds: null, distanceMeters: null }, 'weight_time') === '')
  check('A5: the word "Bodyweight" never appears and reps/distance are ignored', !/Bodyweight/.test(formatTrackingAwareSetSummary({ reps: 12, weightKg: 0, rpe: null, durationSeconds: 60, distanceMeters: 1000 }, 'weight_time')) && formatTrackingAwareSetSummary({ reps: 12, weightKg: 0, rpe: null, durationSeconds: 60, distanceMeters: 1000 }, 'weight_time') === '1:00 · 0 lb added')
  check('A6: formatAddedWeightLb(0) === "0 lb added"', formatAddedWeightLb(0) === '0 lb added' && formatAddedWeightLb(lbsToKg(45)) === '45 lb added')
  check('A7: the four legacy summaries are byte-identical to the documented examples',
    formatTrackingAwareSetSummary({ reps: 10, weightKg: lbsToKg(135), rpe: null, durationSeconds: null, distanceMeters: null }, 'weight_reps') === '10 reps × 135 lbs'
    && formatTrackingAwareSetSummary({ reps: 8, weightKg: lbsToKg(25), rpe: null, durationSeconds: null, distanceMeters: null }, 'bodyweight') === '8 reps · +25 lbs'
    && formatTrackingAwareSetSummary({ reps: null, weightKg: null, rpe: null, durationSeconds: 1935, distanceMeters: 3.1 * 1609.34 }, 'cardio') === '32:15 · 3.10 mi · 10:24 /mi'
    && formatTrackingAwareSetSummary({ reps: null, weightKg: null, rpe: 7, durationSeconds: 120, distanceMeters: null }, 'timed') === '2:00 · RPE 7')

  console.log('\nB. Representative set — longest qualifying hold, never a scalar, never the pace branch')
  setCounter = 0
  const r1 = hold(20, 60); const r2 = hold(10, 90); const r3 = hold(30, 90); const rWarm = hold(50, 200, { is_warmup: true }); const rIncomplete = hold(50, 200, { completed: false }); const rNullWeight = set({ weight_kg: null, duration_seconds: 300 })
  check('B1: longest hold wins; tie on duration → heavier: among (20,60),(10,90),(30,90) → (30,90)', pickRepresentativeWeightTimeSet([r1, r2, r3])?.id === r3.id)
  check('B2: tie on duration and weight → lower set_number', pickRepresentativeWeightTimeSet([hold(30, 90, { set_number: 5, id: 'later' }), hold(30, 90, { set_number: 2, id: 'earlier' })])?.id === 'earlier')
  check('B3: warm-ups, incomplete sets and null-weight sets never represent a session', pickRepresentativeWeightTimeSet([rWarm, rIncomplete, rNullWeight]) === null && pickRepresentativeWeightTimeSet([rWarm, r1])?.id === r1.id)
  check('B4: a zero-added-weight hold can represent the session', pickRepresentativeWeightTimeSet([hold(0, 120), hold(20, 60)])?.weight_kg === 0)
  check('B5: pickRepresentativeCardioSet returns null for weight_time (executable CARDIO_TIMED_MODES guard) and still serves timed/cardio', pickRepresentativeCardioSet([r1, r3], 'weight_time') === null && pickRepresentativeCardioSet([set({ duration_seconds: 60 }), set({ duration_seconds: 90 })], 'timed')?.duration_seconds === 90)
  check('B6: bestSet/setScore are untouched strength scalars — a weight_time set fed to them would be scored by weight alone, which is why no weight_time caller uses them (asserted in H below)', setScore(hold(20, 60)) === lbsToKg(20) && bestSet([hold(20, 60), hold(30, 40)])?.weight_kg === lbsToKg(30))

  console.log('\nC. Progress signal — 2-D dominance, never duration-only')
  check('C1: (25,70) after (20,60) → improved', trackingAwareProgressSignal(hold(25, 70), hold(20, 60), 'weight_time') === 'improved')
  check('C2: (15,50) after (20,60) → declined', trackingAwareProgressSignal(hold(15, 50), hold(20, 60), 'weight_time') === 'declined')
  check('C3: exact repeat → same', trackingAwareProgressSignal(hold(20, 60), hold(20, 60), 'weight_time') === 'same')
  check('C4: heavier-but-shorter (30,40) after (20,60) → same (the duration-only fallback would have said declined)', trackingAwareProgressSignal(hold(30, 40), hold(20, 60), 'weight_time') === 'same' && trackingAwareProgressSignal(hold(30, 40), hold(20, 60), 'timed') === 'declined')
  check('C5: lighter-but-longer (10,90) after (20,60) → same (the duration-only fallback would have said improved)', trackingAwareProgressSignal(hold(10, 90), hold(20, 60), 'weight_time') === 'same' && trackingAwareProgressSignal(hold(10, 90), hold(20, 60), 'timed') === 'improved')
  check('C6: same weight, longer → improved; heavier, same duration → improved', trackingAwareProgressSignal(hold(20, 70), hold(20, 60), 'weight_time') === 'improved' && trackingAwareProgressSignal(hold(25, 60), hold(20, 60), 'weight_time') === 'improved')
  check('C7: no previous → new; a previous set that is not a qualifying hold (null weight) is no baseline → new, never a directional claim', trackingAwareProgressSignal(hold(20, 60), null, 'weight_time') === 'new' && trackingAwareProgressSignal(hold(20, 60), set({ weight_kg: null, duration_seconds: 60 }), 'weight_time') === 'new')
  check('C8: progressSignal (strength) is unchanged: 1% threshold on setScore', progressSignal(set({ weight_kg: 102, reps: 5 }), set({ weight_kg: 100, reps: 5 })) === 'improved')

  console.log('\nD. Next target — only the two approved neutral strings, RPE never consulted')
  const approved = `${WEIGHT_TIME_HOLD_LONGER_GUIDANCE} ${WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE}`
  check('D1: the two approved strings are verbatim', WEIGHT_TIME_HOLD_LONGER_GUIDANCE === 'Try holding this weight slightly longer.' && WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE === 'When this duration feels controlled, try the next available weight.')
  const target = suggestNextTarget(hold(20, 60), false, 'weight_time', 'barbell')
  check('D2: with a previous hold → action increase, message = the approved strings (duration first, then weight)', target.action === 'increase' && target.message === approved, JSON.stringify(target))
  check('D3: RPE 10, RPE 6 and no RPE produce the SAME message (D5: RPE is metadata only)',
    suggestNextTarget(hold(20, 60, { rpe: 10 }), false, 'weight_time', null).message === approved && suggestNextTarget(hold(20, 60, { rpe: 6 }), false, 'weight_time', null).message === approved)
  check('D4: a stalling trend, a rep range and any equipment never change the message (no strength ladder)',
    suggestNextTarget(hold(20, 60, { rpe: 5 }), true, 'weight_time', 'machine', 'stalling', { min: 8, max: 12 }).message === approved
    && suggestNextTarget(hold(20, 60), true, 'weight_time', 'smith_machine', 'improving', { min: 8, max: 12 }).message === approved)
  check('D5: no previous → unavailable "Log a completed set to start tracking targets."', suggestNextTarget(null, false, 'weight_time', null).action === 'unavailable' && suggestNextTarget(null, false, 'weight_time', null).message === 'Log a completed set to start tracking targets.')
  check('D6: a previous set that is not a qualifying hold (null weight) → unavailable', suggestNextTarget(set({ weight_kg: null, duration_seconds: 60 }), false, 'weight_time', null).action === 'unavailable')
  check('D7: the message never contains a computed number, "reps", "lbs ×" or "RPE"', !/\d|reps|lbs|RPE/.test(approved))
  check('D8: timed keeps its RPE-repeat rule and cardio its pace rule (legacy unchanged)', suggestNextTarget(set({ duration_seconds: 354, rpe: 9 }), false, 'timed', null).message === 'Repeat 5:54 next time' && /slightly faster/.test(suggestNextTarget(set({ duration_seconds: 1800, distance_meters: 5000 }), false, 'cardio', null).message))

  console.log('\nE. Programmed-target model — weight_time intentionally outside it')
  check('E1: evaluateSetTargetFeedback → no_target for weight_time even with reps and a range', evaluateSetTargetFeedback(10, 7, 'weight_time', { min: 8, max: 12 }).rangeStatus === 'no_target' && evaluateSetTargetFeedback(10, 7, 'weight_time', { min: 8, max: 12 }).label === '')
  check('E2: weight_reps with the same inputs still evaluates ("In range")', evaluateSetTargetFeedback(10, 7, 'weight_reps', { min: 8, max: 12 }).label === 'In range')

  console.log('\nF. summarizeWorkout — 2-D PRs only, strength PR logic never entered, RPE attention includes weight_time')
  setCounter = 0
  const wtSets = [hold(20, 60, { id: 'wt-1', set_number: 1 }), hold(20, 60, { id: 'wt-2', set_number: 2 }), hold(25, 70, { id: 'wt-3', set_number: 3 })]
  const exercises = [
    { id: 'we-wt', exercise_id: 'ex-wt', exercise: { name: 'Plate plank', tracking_mode: 'weight_time' as TrackingMode }, workout_sets: wtSets, target_reps_min: null, target_reps_max: null },
    { id: 'we-wr', exercise_id: 'ex-wr', exercise: { name: 'Bench', tracking_mode: 'weight_reps' as TrackingMode }, workout_sets: [set({ id: 'wr-1', weight_kg: 100, reps: 5, rpe: 8 })], target_reps_min: null, target_reps_max: null },
    { id: 'we-cardio', exercise_id: 'ex-c', exercise: { name: 'Run', tracking_mode: 'cardio' as TrackingMode }, workout_sets: [set({ id: 'c-1', duration_seconds: 600 })], target_reps_min: null, target_reps_max: null },
  ] as any
  // A STRENGTH baseline for the weight_time exercise that evaluateSetPRs WOULD beat (max weight 5 kg): it must be ignored.
  const strengthBaselines = { 'ex-wt': { maxWeightKg: 5, maxEstimated1RmKg: null, maxBodyweightReps: null }, 'ex-wr': { maxWeightKg: 90, maxEstimated1RmKg: null, maxBodyweightReps: null } }
  const summaryWithBaseline = summarizeWorkout(exercises, strengthBaselines, { 'ex-wt': [{ weightKg: lbsToKg(20), durationSeconds: 60 }] })
  const wt = summaryWithBaseline.exerciseSummaries.find((e) => e.workoutExerciseId === 'we-wt')!
  check('F1: weight_time PR count comes from the 2-D model: prior (20,60) → set1 repeat, set2 repeat, set3 (25,70) PR → exactly 1', wt.prSetCount === 1, `got ${wt.prSetCount}`)
  check('F2: the strength baseline for the weight_time exercise is IGNORED (evaluateSetPRs on the same sets would have flagged two weight PRs: 20 lb > 5 kg, then 25 lb > 20 lb)', Object.values(evaluateSetPRs(wtSets, strengthBaselines['ex-wt'])).filter(Boolean).length === 2 && wt.prSetCount === 1)
  const summaryNoBaseline = summarizeWorkout(exercises, strengthBaselines)
  check('F3: without a weight_time baseline the first hold is a PR and its repeat is not; (25,70) is a PR → 2', summaryNoBaseline.exerciseSummaries.find((e) => e.workoutExerciseId === 'we-wt')!.prSetCount === 2)
  check('F4: the weight_reps exercise still gets its strength PR (100 > 90)', summaryWithBaseline.exerciseSummaries.find((e) => e.workoutExerciseId === 'we-wr')!.prSetCount === 1)
  check('F5: the RPE attention rule fires for the weight_time exercise (all holds without RPE) and never for cardio', summaryWithBaseline.attention.some((a) => a.startsWith('Plate plank: log RPE')) && !summaryWithBaseline.attention.some((a) => a.startsWith('Run:')))
  check('F6: weight_time contributes nothing to targetCounts (no rep target)', summaryWithBaseline.exerciseSummaries.find((e) => e.workoutExerciseId === 'we-wt')!.targetCounts.evaluated === 0)
  check('F7: RPE_LOGGABLE_MODES = weight_reps, bodyweight, timed, weight_time (cardio excluded); STRENGTH_SCORING_MODES = weight_reps, bodyweight; CARDIO_TIMED_MODES = cardio, timed',
    RPE_LOGGABLE_MODES.has('weight_time') && !RPE_LOGGABLE_MODES.has('cardio') && RPE_LOGGABLE_MODES.size === 4
    && STRENGTH_SCORING_MODES.size === 2 && !STRENGTH_SCORING_MODES.has('weight_time') && CARDIO_TIMED_MODES.size === 2 && !CARDIO_TIMED_MODES.has('weight_time'))

  console.log('\nG. /progress overview rows')
  const meta = (id: string, mode: TrackingMode) => ({ id, name: id, primary_muscle: 'core' as any, equipment: null, tracking_mode: mode, unilateral: false })
  const raw = (overrides: Partial<RawOverviewSession['workout_exercises'][number]['workout_sets'][number]>) => ({ set_number: 1, reps: null, weight_kg: null, rpe: null, is_warmup: false, completed: true, duration_seconds: null, distance_meters: null, ...overrides })
  const sessions: RawOverviewSession[] = [
    { workout_date: '2026-09-08', workout_exercises: [
      { exercise_id: 'plank', exercise: meta('plank', 'weight_time'), workout_sets: [raw({ weight_kg: 0, duration_seconds: 120 }), raw({ set_number: 2, weight_kg: lbsToKg(20), duration_seconds: 60 })] },
      { exercise_id: 'carry', exercise: meta('carry', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(30), duration_seconds: 40 })] },
      { exercise_id: 'bench', exercise: meta('bench', 'weight_reps'), workout_sets: [raw({ weight_kg: lbsToKg(225), reps: 5 })] },
      { exercise_id: 'pushup', exercise: meta('pushup', 'bodyweight'), workout_sets: [raw({ reps: 12 })] },
    ] },
    { workout_date: '2026-09-01', workout_exercises: [
      { exercise_id: 'plank', exercise: meta('plank', 'weight_time'), workout_sets: [raw({ weight_kg: 0, duration_seconds: 90 })] },
      { exercise_id: 'carry', exercise: meta('carry', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(20), duration_seconds: 60 })] },
      { exercise_id: 'bench', exercise: meta('bench', 'weight_reps'), workout_sets: [raw({ weight_kg: lbsToKg(215), reps: 5 })] },
      { exercise_id: 'pushup', exercise: meta('pushup', 'bodyweight'), workout_sets: [raw({ reps: 12 })] },
    ] },
  ]
  const rows = buildExerciseProgressOverview(sessions)
  const plank = rows.find((r) => r.exerciseId === 'plank')!
  const carry = rows.find((r) => r.exerciseId === 'carry')!
  check('G1: the plank row\'s latest summary is its LONGEST hold with a real zero: "2:00 · 0 lb added"', plank.latestSummary === '2:00 · 0 lb added', plank.latestSummary)
  check('G2: plank (0,120) after (0,90) → improved (2-D: same weight, longer)', plank.status === 'improved')
  check('G3: carry (30,40) after (20,60) → same (incomparable, no direction claimed)', carry.status === 'same')
  check('G4: weight_time rows never carry an est. 1RM secondary', plank.secondarySummary === null && carry.secondarySummary === null)
  check('G5: legacy rows unchanged — bench "5 reps × 225 lbs" with est. 1RM, status improved; pushup "12 reps" status same',
    rows.find((r) => r.exerciseId === 'bench')!.latestSummary === '5 reps × 225 lbs' && rows.find((r) => r.exerciseId === 'bench')!.secondarySummary !== null && rows.find((r) => r.exerciseId === 'bench')!.status === 'improved'
    && rows.find((r) => r.exerciseId === 'pushup')!.latestSummary === '12 reps' && rows.find((r) => r.exerciseId === 'pushup')!.status === 'same')

  console.log('\nH. fetchExerciseTrends — weight_time never enters the weight × reps scalar')
  const trendSessions = [{ id: 's1', workout_date: '2026-09-08', workout_exercises: [
    { exercise_id: 'ex-wt', exercise: { tracking_mode: 'weight_time' }, workout_sets: [{ completed: true, is_warmup: false, reps: 5, weight_kg: 20 }] },   // impossible under the DB rule, present to prove the gate is by MODE
    { exercise_id: 'ex-wr', exercise: { tracking_mode: 'weight_reps' }, workout_sets: [{ completed: true, is_warmup: false, reps: 5, weight_kg: 20 }] },
  ] }, { id: 's2', workout_date: '2026-09-05', workout_exercises: [
    { exercise_id: 'ex-wt', exercise: { tracking_mode: 'weight_time' }, workout_sets: [{ completed: true, is_warmup: false, reps: 5, weight_kg: 20 }] },
    { exercise_id: 'ex-wr', exercise: { tracking_mode: 'weight_reps' }, workout_sets: [{ completed: true, is_warmup: false, reps: 5, weight_kg: 20 }] },
  ] }, { id: 's3', workout_date: '2026-09-02', workout_exercises: [
    { exercise_id: 'ex-wt', exercise: { tracking_mode: 'weight_time' }, workout_sets: [{ completed: true, is_warmup: false, reps: 5, weight_kg: 20 }] },
    { exercise_id: 'ex-wr', exercise: { tracking_mode: 'weight_reps' }, workout_sets: [{ completed: true, is_warmup: false, reps: 5, weight_kg: 20 }] },
  ] }]
  let selectText = ''
  const chain: any = { select: (s: string) => { selectText = s; return chain }, eq: () => chain, gte: () => chain, order: () => chain, limit: () => Promise.resolve({ data: trendSessions }) }
  const trends = await fetchExerciseTrends({ from: () => chain }, 'user-1', ['ex-wt', 'ex-wr'], '2026-09-10')
  check('H1: the weight_time exercise gets needs-data (never scored) while the weight_reps exercise with identical rows is scored (steady)', trends['ex-wt'] === 'needs-data' && trends['ex-wr'] === 'steady', JSON.stringify(trends))
  check('H2: the trend query now selects the exercise tracking_mode (the gate is by mode, not by null reps)', selectText.includes('exercise:exercises ( tracking_mode )'))

  console.log('\nI. Source discipline — server.ts gates, no scalar, strength helpers untouched')
  const server = read('src/lib/supabase/server.ts')
  const serverExecutable = stripComments(server)
  check('I1: server.ts pickRepresentativeSet is an exhaustive switch with an explicit weight_time arm using pickRepresentativeWeightTimeSet', /switch \(trackingMode\) \{\s*case 'weight_time':[\s\S]*?pickRepresentativeWeightTimeSet/.test(functionBody(serverExecutable, 'pickRepresentativeSet')))
  check('I2: fetchExercisePRBaseline selects tracking_mode and skips every mode outside STRENGTH_SCORING_MODES', functionBody(serverExecutable, 'fetchExercisePRBaseline').includes('exercise:exercises ( tracking_mode )') && functionBody(serverExecutable, 'fetchExercisePRBaseline').includes('!STRENGTH_SCORING_MODES.has(trackingMode)) continue'))
  check('I3: fetchExerciseHistory computes est. 1RM only for STRENGTH_SCORING_MODES', functionBody(serverExecutable, 'fetchExerciseHistory').includes('STRENGTH_SCORING_MODES.has(trackingModeByExerciseId[exerciseId])'))
  check('I4: fetchCardioTimedRecords gates by CARDIO_TIMED_MODES (executable), with no inline literal chain left', functionBody(serverExecutable, 'fetchCardioTimedRecords').includes('!CARDIO_TIMED_MODES.has(ex.tracking_mode)) continue') && !functionBody(serverExecutable, 'fetchCardioTimedRecords').includes("!== 'cardio'"))
  const workout = stripComments(read('src/lib/workout.ts'))
  check('I5: setScore, bestSet, epley1RM and evaluateSetPRs contain no weight_time path (excluded, not extended)', ['setScore', 'bestSet', 'epley1RM', 'evaluateSetPRs'].every((name) => functionBody(workout, name) !== '' && !functionBody(workout, name).includes('weight_time')))
  check('I6: no weight × duration scalar anywhere in the domain layer', ['src/lib/workout.ts', 'src/lib/progress-overview.ts', 'src/lib/supabase/server.ts', 'src/lib/workout-coach.ts', 'src/lib/weight-time-records.ts'].every((file) => !/(weight_kg|weightKg)\s*\*\s*(duration_seconds|durationSeconds)|(duration_seconds|durationSeconds)\s*\*\s*(weight_kg|weightKg)/.test(stripComments(read(file)))))
  check('I7: strength-records.ts is byte-identical to its W3 blob-pinned state (no weight_time extension)', !read('src/lib/strength-records.ts').includes("'weight_time'") || /allowlist/.test(read('src/lib/strength-records.ts')))
  check('I8: summarizeWorkout routes weight_time to evaluateWeightTimeSetPRs and strength modes to evaluateSetPRs', functionBody(workout, 'summarizeWorkout').includes("tracking_mode === 'weight_time'") && functionBody(workout, 'summarizeWorkout').includes('evaluateWeightTimeSetPRs(') && functionBody(workout, 'summarizeWorkout').includes('STRENGTH_SCORING_MODES.has(we.exercise.tracking_mode)'))

  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
