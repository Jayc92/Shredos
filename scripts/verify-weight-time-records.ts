// ============================================================
// ForgeFitOS — W8 verifier: the dedicated weight_time record model.
// (docs/weight-time-coordinated-implementation-plan.md §4.2, §6, §8.7, §16 W8.)
//
// Executes the REAL module (src/lib/weight-time-records.ts) over
// constructed performances and over a fake Supabase query builder, and
// asserts every rule of the approved two-dimensional model:
//   qualifying rule (0 added weight legal; null is not zero; warm-ups out),
//   Pareto dominance, current frontier (complete, deduplicated, sorted),
//   longest/heaviest hold with their tie-breaks, chronological PR
//   reconstruction (exact repeat, same-weight longer, heavier same-duration,
//   incomparable heavier/shorter, incomparable lighter/longer, dominated,
//   historical PR surviving later domination), deterministic ordering,
//   RPE irrelevance, the two-dimensional status signal, and — by source —
//   that no scalar score and no strength helper enters the module.
//
// Never contacts Supabase, Vercel, or any remote service.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-records.ts
// ============================================================

import path from 'node:path'
import { readFileSync } from 'node:fs'

import {
  isQualifyingWeightTimeSet, compareChronologically, dominates, isExactRepeat,
  computeCurrentFrontier, selectLongestHold, selectHeaviestHold,
  reconstructWeightTimePREvents, evaluateWeightTimeSetPRs, weightTimeProgressSignal,
  summarizeWeightTimePerformances, collectWeightTimePerformances,
  fetchWeightTimeRecords, fetchWeightTimeExerciseDetail, fetchWeightTimePRBaselines,
} from '../src/lib/weight-time-records'
import type { WeightTimePerformance, WeightTimeRawSession } from '../src/lib/weight-time-records'

const repositoryRoot = process.cwd()
let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

// ── Performance factory: chronological identity encoded in the arguments ──
let counter = 0
function perf(weightKg: number, durationSeconds: number, options: Partial<WeightTimePerformance> = {}): WeightTimePerformance {
  counter += 1
  const sequence = String(counter).padStart(3, '0')
  return {
    setId: options.setId ?? `set-${sequence}`,
    exerciseId: options.exerciseId ?? 'ex-wt',
    sessionId: options.sessionId ?? `s-${sequence}`,
    workoutDate: options.workoutDate ?? `2026-08-${String(Math.min(28, counter)).padStart(2, '0')}`,
    sessionCreatedAt: options.sessionCreatedAt ?? `2026-08-${String(Math.min(28, counter)).padStart(2, '0')}T10:00:00Z`,
    orderIndex: options.orderIndex ?? 0,
    setNumber: options.setNumber ?? 1,
    weightKg,
    durationSeconds,
    rpe: options.rpe ?? null,
  }
}
const pair = (performance: WeightTimePerformance | null): string => (performance ? `(${performance.weightKg},${performance.durationSeconds})` : 'null')
const pairs = (performances: WeightTimePerformance[]): string => performances.map(pair).join(' ')

async function main(): Promise<number> {
  console.log('W8 verification — weight_time two-dimensional record model')
  console.log(`root=${repositoryRoot}`)

  console.log('\nA. Qualifying rule')
  const base = { id: 'x', set_number: 1, rpe: null, is_warmup: false, completed: true }
  check('A1: completed non-warmup, weight 0, duration 60 QUALIFIES (0 added weight is a valid intentional baseline)', isQualifyingWeightTimeSet({ ...base, weight_kg: 0, duration_seconds: 60 }))
  check('A2: weight 20, duration 60 qualifies', isQualifyingWeightTimeSet({ ...base, weight_kg: 20, duration_seconds: 60 }))
  check('A3: null weight does NOT qualify (null is not zero)', !isQualifyingWeightTimeSet({ ...base, weight_kg: null, duration_seconds: 60 }))
  check('A4: duration 0, null duration and negative duration do NOT qualify',
    !isQualifyingWeightTimeSet({ ...base, weight_kg: 20, duration_seconds: 0 }) && !isQualifyingWeightTimeSet({ ...base, weight_kg: 20, duration_seconds: null }) && !isQualifyingWeightTimeSet({ ...base, weight_kg: 20, duration_seconds: -5 }))
  check('A5: negative weight does NOT qualify', !isQualifyingWeightTimeSet({ ...base, weight_kg: -1, duration_seconds: 60 }))
  check('A6: an incomplete set does NOT qualify', !isQualifyingWeightTimeSet({ ...base, completed: false, weight_kg: 20, duration_seconds: 60 }))
  check('A7: a completed WARM-UP does NOT qualify', !isQualifyingWeightTimeSet({ ...base, is_warmup: true, weight_kg: 20, duration_seconds: 60 }))

  console.log('\nB. Pareto dominance and exact repeats')
  check('B1: (25,70) dominates (20,60); (20,60) does not dominate (25,70)', dominates({ weightKg: 25, durationSeconds: 70 }, { weightKg: 20, durationSeconds: 60 }) && !dominates({ weightKg: 20, durationSeconds: 60 }, { weightKg: 25, durationSeconds: 70 }))
  check('B2: same weight, longer duration dominates; heavier, same duration dominates', dominates({ weightKg: 20, durationSeconds: 70 }, { weightKg: 20, durationSeconds: 60 }) && dominates({ weightKg: 25, durationSeconds: 60 }, { weightKg: 20, durationSeconds: 60 }))
  check('B3: an exact tie dominates in neither direction and is an exact repeat', !dominates({ weightKg: 20, durationSeconds: 60 }, { weightKg: 20, durationSeconds: 60 }) && isExactRepeat({ weightKg: 20, durationSeconds: 60 }, { weightKg: 20, durationSeconds: 60 }))
  check('B4: heavier-but-shorter and lighter-but-longer are INCOMPARABLE (neither dominates)', !dominates({ weightKg: 30, durationSeconds: 40 }, { weightKg: 20, durationSeconds: 60 }) && !dominates({ weightKg: 20, durationSeconds: 60 }, { weightKg: 30, durationSeconds: 40 }))

  console.log('\nC. Current frontier')
  counter = 0
  const zero = perf(0, 120); const twentySixty = perf(20, 60); const thirtyForty = perf(30, 40); const dominated = perf(15, 50); const repeat = perf(20, 60)
  const frontier = computeCurrentFrontier([dominated, repeat, thirtyForty, zero, twentySixty])
  check('C1: zero-added-weight (0,120) PARTICIPATES in the frontier alongside (20,60) and (30,40); the dominated (15,50) is out',
    pairs(frontier) === '(0,120) (20,60) (30,40)', `got ${pairs(frontier)}`)
  check('C2: the exact repeat (20,60) creates NO duplicate frontier display point, and the earliest achieved represents the pair',
    frontier.filter((point) => point.weightKg === 20).length === 1 && frontier.find((point) => point.weightKg === 20)?.setId === twentySixty.setId)
  check('C3: presentation order is weight ascending, duration descending', frontier.every((point, index) => index === 0 || point.weightKg > frontier[index - 1].weightKg))
  check('C4: the frontier is COMPLETE — three incomparable points are all returned, never collapsed to one number', frontier.length === 3)
  const sameWeightLonger = computeCurrentFrontier([perf(20, 60), perf(20, 70)])
  check('C5: same weight, longer duration removes the shorter from the current frontier', pairs(sameWeightLonger) === '(20,70)', `got ${pairs(sameWeightLonger)}`)

  console.log('\nD. Longest hold and heaviest hold with tie-breaks')
  counter = 0
  const a = perf(10, 90); const b = perf(30, 90); const c = perf(30, 90); const d = perf(30, 40)
  check('D1: longest hold = max duration; tie on duration → HIGHEST added weight: among (10,90),(30,90) → (30,90)', selectLongestHold([a, b])?.setId === b.setId)
  check('D2: longest hold tie on duration AND weight → the EARLIEST achieved: (30,90)#2 before (30,90)#3', selectLongestHold([c, b])?.setId === b.setId)
  check('D3: heaviest hold = max weight; tie on weight → LONGEST duration: among (30,40),(30,90) → (30,90)', selectHeaviestHold([d, b])?.setId === b.setId)
  check('D4: heaviest hold tie on weight AND duration → the EARLIEST achieved', selectHeaviestHold([c, b])?.setId === b.setId)
  check('D5: longest hold carries its associated weight and heaviest hold its associated duration (they are performances, not bare numbers)',
    selectLongestHold([a, d])?.weightKg === 10 && selectHeaviestHold([a, d])?.durationSeconds === 40)
  check('D6: empty input → null for both', selectLongestHold([]) === null && selectHeaviestHold([]) === null)

  console.log('\nE. Chronological PR reconstruction')
  counter = 0
  const p1 = perf(20, 60)            // first ever → PR
  const p2 = perf(20, 60)            // exact repeat → not PR
  const p3 = perf(20, 70)            // same weight, longer → PR
  const p4 = perf(25, 70)            // heavier, same duration → PR (dominates p3)
  const p5 = perf(30, 40)            // heavier but shorter, incomparable → PR
  const p6 = perf(10, 90)            // lighter but longer, incomparable → PR
  const p7 = perf(15, 50)            // dominated by p1/p3/p4 → not PR
  const p8 = perf(0, 100)            // zero added weight, longer than nothing at weight 0... dominated by p6 (10,90)? 10>=0 but 90<100 → incomparable → PR
  const events = reconstructWeightTimePREvents([p7, p3, p1, p8, p5, p2, p6, p4].sort(() => 0)) // deliberately shuffled input
  const eventIds = events.map((event) => event.setId)
  check('E1: first-ever qualifying performance (20,60) is a Weight-time PR', eventIds.includes(p1.setId))
  check('E2: exact repeat (20,60) is NOT a PR', !eventIds.includes(p2.setId))
  check('E3: same weight, longer (20,70) IS a PR', eventIds.includes(p3.setId))
  check('E4: heavier, same duration (25,70) IS a PR', eventIds.includes(p4.setId))
  check('E5: incomparable heavier/shorter (30,40) IS a PR', eventIds.includes(p5.setId))
  check('E6: incomparable lighter/longer (10,90) IS a PR', eventIds.includes(p6.setId))
  check('E7: dominated (15,50) is NOT a PR', !eventIds.includes(p7.setId))
  check('E8: zero-added-weight (0,100), incomparable with the prior frontier, IS a PR', eventIds.includes(p8.setId))
  check('E9: events are returned most recent first, in real chronology', eventIds.join(',') === [p8, p6, p5, p4, p3, p1].map((x) => x.setId).join(','), `got ${eventIds.join(',')}`)
  const laterFrontier = computeCurrentFrontier([p1, p2, p3, p4, p5, p6, p7, p8])
  check('E10: HISTORICAL PR REMAINS HISTORICAL after later domination — (20,60) and (20,70) are PR events yet absent from the CURRENT frontier (dominated by (25,70))',
    eventIds.includes(p1.setId) && eventIds.includes(p3.setId) && !laterFrontier.some((point) => point.setId === p1.setId || point.setId === p3.setId) && laterFrontier.some((point) => point.setId === p4.setId))

  console.log('\nF. Deterministic ordering — never the incidental row order')
  counter = 0
  const sameDate = '2026-09-01'
  const earlySession = { workoutDate: sameDate, sessionCreatedAt: '2026-09-01T08:00:00Z', sessionId: 's-early' }
  const lateSession = { workoutDate: sameDate, sessionCreatedAt: '2026-09-01T18:00:00Z', sessionId: 's-late' }
  const q1 = perf(20, 60, { ...earlySession, orderIndex: 0, setNumber: 1, setId: 'q1' })
  const q2 = perf(20, 60, { ...earlySession, orderIndex: 0, setNumber: 2, setId: 'q2' })   // repeat within the session → not PR
  const q3 = perf(25, 60, { ...earlySession, orderIndex: 1, setNumber: 1, setId: 'q3' })   // later exercise block, heavier → PR
  const q4 = perf(20, 60, { ...lateSession, orderIndex: 0, setNumber: 1, setId: 'q4' })    // later session, repeat → not PR
  const sorted = [q4, q3, q2, q1].sort(compareChronologically).map((x) => x.setId).join(',')
  check('F1: same date → session created_at → exercise order_index → set_number decide the order', sorted === 'q1,q2,q3,q4', `got ${sorted}`)
  const fEvents = reconstructWeightTimePREvents([q4, q3, q2, q1]).map((x) => x.setId)
  check('F2: reconstruction over a reversed input yields the same events: q1 PR, q2 repeat, q3 PR, q4 repeat', fEvents.join(',') === 'q3,q1', `got ${fEvents.join(',')}`)
  const tieBreakById = [perf(20, 60, { ...earlySession, orderIndex: 0, setNumber: 1, setId: 'z' }), perf(20, 60, { ...earlySession, orderIndex: 0, setNumber: 1, setId: 'a' })].sort(compareChronologically).map((x) => x.setId).join(',')
  check('F3: with every other key equal the set id is the final stable tie-break', tieBreakById === 'a,z')

  console.log('\nG. Active-workout badge evaluation and RPE irrelevance')
  counter = 0
  const current1 = perf(20, 60, { sessionId: 'cur', workoutDate: '2026-09-10', sessionCreatedAt: '2026-09-10T10:00:00Z', setNumber: 1, setId: 'c1' })
  const current2 = perf(20, 60, { sessionId: 'cur', workoutDate: '2026-09-10', sessionCreatedAt: '2026-09-10T10:00:00Z', setNumber: 2, setId: 'c2' })
  const current3 = perf(25, 70, { sessionId: 'cur', workoutDate: '2026-09-10', sessionCreatedAt: '2026-09-10T10:00:00Z', setNumber: 3, setId: 'c3' })
  const badges = evaluateWeightTimeSetPRs([current3, current1, current2], [{ weightKg: 20, durationSeconds: 60 }])
  check('G1: against a prior (20,60): set 1 (20,60) repeat → no badge; set 2 repeat → no badge; set 3 (25,70) → Weight-time PR', badges.c1 === false && badges.c2 === false && badges.c3 === true)
  const badgesNoPrior = evaluateWeightTimeSetPRs([current1, current2], [])
  check('G2: with no prior history the first set is a PR and its in-session repeat is not', badgesNoPrior.c1 === true && badgesNoPrior.c2 === false)
  counter = 0
  const withRpe = [perf(20, 60, { rpe: 6 }), perf(25, 70, { rpe: 10 })]
  counter = 0
  const withoutRpe = [perf(20, 60, { rpe: null }), perf(25, 70, { rpe: null })]
  const strip = (summary: ReturnType<typeof summarizeWeightTimePerformances>) => JSON.stringify(summary, (key, value) => (key === 'rpe' ? undefined : value))
  check('G3: RPE is metadata only — identical records, frontier and PR events with and without RPE', strip(summarizeWeightTimePerformances(withRpe)) === strip(summarizeWeightTimePerformances(withoutRpe)))

  console.log('\nH. Two-dimensional status signal (no scalar)')
  check('H1: latest dominates previous → improved', weightTimeProgressSignal({ weightKg: 25, durationSeconds: 70 }, { weightKg: 20, durationSeconds: 60 }) === 'improved')
  check('H2: previous dominates latest → declined', weightTimeProgressSignal({ weightKg: 15, durationSeconds: 50 }, { weightKg: 20, durationSeconds: 60 }) === 'declined')
  check('H3: exact repeat → same', weightTimeProgressSignal({ weightKg: 20, durationSeconds: 60 }, { weightKg: 20, durationSeconds: 60 }) === 'same')
  check('H4: incomparable heavier/shorter → same (no direction is claimed)', weightTimeProgressSignal({ weightKg: 30, durationSeconds: 40 }, { weightKg: 20, durationSeconds: 60 }) === 'same')
  check('H5: incomparable lighter/longer → same', weightTimeProgressSignal({ weightKg: 10, durationSeconds: 90 }, { weightKg: 20, durationSeconds: 60 }) === 'same')
  check('H6: no previous → new; no latest → same', weightTimeProgressSignal({ weightKg: 10, durationSeconds: 90 }, null) === 'new' && weightTimeProgressSignal(null, { weightKg: 10, durationSeconds: 90 }) === 'same')

  console.log('\nI. Source discipline — no scalar, no strength helpers')
  const moduleText = readFileSync(path.join(repositoryRoot, 'src/lib/weight-time-records.ts'), 'utf8')
  // Executable text only: the header comment legitimately NAMES the strength helpers it refuses to use.
  const executableText = moduleText.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  check('I1: the executable module never multiplies weight by duration and never mentions a combined score',
    !/weightKg\s*\*\s*durationSeconds|durationSeconds\s*\*\s*weightKg|weight_kg\s*\*\s*duration_seconds|score/i.test(executableText))
  check('I2: the executable module imports nothing from strength-records, workout.ts or workout-coach and never references epley1RM, setScore, bestSet or classifyTrend',
    !/from '@\/lib\/(strength-records|workout|workout-coach)'/.test(executableText) && !/\b(epley1RM|setScore|bestSet|classifyTrend)\b/.test(executableText))
  check('I3: RPE is never read by a rule (it appears only in types, the raw adapter and comments)',
    !/\.rpe\b/.test(executableText.replace(/rpe: set\.rpe/g, '')))

  console.log('\nJ. Fetchers over a fake Supabase builder — warm-ups visible in history, excluded from records; mode and session filters')
  const sessions: WeightTimeRawSession[] = [
    { id: 's1', workout_date: '2026-08-01', created_at: '2026-08-01T10:00:00Z', workout_exercises: [
      { id: 'we1', exercise_id: 'ex-wt', order_index: 0, exercise: { id: 'ex-wt', name: 'Plate plank', tracking_mode: 'weight_time', unilateral: false }, workout_sets: [
        { id: 'w1', set_number: 1, weight_kg: 20, duration_seconds: 60, rpe: 7, is_warmup: false, completed: true },
        { id: 'w2', set_number: 2, weight_kg: 50, duration_seconds: 200, rpe: null, is_warmup: true, completed: true },   // warm-up: visible, never a record
        { id: 'w3', set_number: 3, weight_kg: 0, duration_seconds: 120, rpe: null, is_warmup: false, completed: true },
      ] },
      { id: 'we2', exercise_id: 'ex-wr', order_index: 1, exercise: { id: 'ex-wr', name: 'Bench', tracking_mode: 'weight_reps', unilateral: false }, workout_sets: [
        { id: 'w4', set_number: 1, weight_kg: 100, duration_seconds: 60, rpe: null, is_warmup: false, completed: true },
      ] },
    ] },
    { id: 's2', workout_date: '2026-08-08', created_at: '2026-08-08T10:00:00Z', workout_exercises: [
      { id: 'we3', exercise_id: 'ex-wt', order_index: 0, exercise: { id: 'ex-wt', name: 'Plate plank', tracking_mode: 'weight_time', unilateral: false }, workout_sets: [
        { id: 'w5', set_number: 1, weight_kg: 25, duration_seconds: 70, rpe: null, is_warmup: false, completed: true },
        { id: 'w6', set_number: 2, weight_kg: 30, duration_seconds: 40, rpe: null, is_warmup: false, completed: false },  // incomplete: not history, not a record
      ] },
    ] },
    { id: 's3', workout_date: '2026-08-15', created_at: '2026-08-15T10:00:00Z', workout_exercises: [
      { id: 'we4', exercise_id: 'ex-wt', order_index: 0, exercise: { id: 'ex-wt', name: 'Plate plank', tracking_mode: 'weight_time', unilateral: false }, workout_sets: [
        { id: 'w7', set_number: 1, weight_kg: 30, duration_seconds: 40, rpe: null, is_warmup: false, completed: true },
      ] },
    ] },
  ]
  class FakeQuery {
    private readonly filters: Array<[string, unknown, 'eq' | 'neq']> = []
    private selectText = ''
    select(columns: string): this { this.selectText = columns; return this }
    eq(column: string, value: unknown): this { this.filters.push([column, value, 'eq']); return this }
    neq(column: string, value: unknown): this { this.filters.push([column, value, 'neq']); return this }
    then<T>(onFulfilled: (value: { data: unknown; error: null }) => T): Promise<T> {
      let rows: WeightTimeRawSession[] = structuredClone(sessions)
      for (const [column, value, op] of this.filters) {
        if (column === 'id' && op === 'neq') rows = rows.filter((session) => session.id !== value)
        if (column === 'workout_exercises.exercise_id') {
          rows = rows.map((session) => ({ ...session, workout_exercises: session.workout_exercises.filter((block) => block.exercise_id === value) })).filter((session) => session.workout_exercises.length > 0)
        }
      }
      if (this.filters.some(([column]) => column === 'workout_exercises.exercise_id') && !this.selectText.includes('!inner')) throw new Error('embedded filter without !inner')
      return Promise.resolve({ data: rows, error: null }).then(onFulfilled)
    }
  }
  const fake = { from: (_table: string) => new FakeQuery() }
  const records = await fetchWeightTimeRecords(fake, 'user-1')
  check('J1: records cover ONLY weight_time exercises (the weight_reps Bench with a duration is excluded by mode)', records.records.length === 1 && records.records[0].exerciseId === 'ex-wt')
  const summary = records.records[0].summary
  check('J2: the warm-up (50,200) is excluded from longest hold, heaviest hold, frontier and PR events', summary.longestHold?.setId !== 'w2' && summary.heaviestHold?.setId !== 'w2' && !summary.frontier.some((point) => point.setId === 'w2') && !summary.prEvents.some((event) => event.setId === 'w2'))
  check('J3: longest hold = (0,120) — the zero-added-weight set — and heaviest hold = (30,40)', summary.longestHold?.setId === 'w3' && summary.heaviestHold?.setId === 'w7')
  check('J4: current frontier = (0,120) (25,70) (30,40); (20,60) fell off (dominated by (25,70))', pairs(summary.frontier) === '(0,120) (25,70) (30,40)', `got ${pairs(summary.frontier)}`)
  check('J5: PR events = w7 (30,40), w5 (25,70), w3 (0,120), w1 (20,60) most recent first — the dominated (20,60) keeps its historical PR', summary.prEvents.map((event) => event.setId).join(',') === 'w7,w5,w3,w1', `got ${summary.prEvents.map((event) => event.setId).join(',')}`)
  check('J6: recent PR events carry exercise name and are most recent first', records.recentPREvents.length === 4 && records.recentPREvents[0].setId === 'w7' && records.recentPREvents[0].exerciseName === 'Plate plank')
  const detail = await fetchWeightTimeExerciseDetail(fake, 'user-1', 'ex-wt')
  check('J7: detail history shows the warm-up (flagged) and every completed set, but not the incomplete set', detail !== null && detail.history.some((entry) => entry.setId === 'w2' && entry.isWarmup) && !detail.history.some((entry) => entry.setId === 'w6') && detail.history.length === 5)
  check('J8: detail latest qualifying = w7 and the previous-session qualifying = w5', detail?.latestQualifying?.setId === 'w7' && detail?.previousSessionQualifying?.setId === 'w5')
  check('J9: detail for an exercise with no history → null', (await fetchWeightTimeExerciseDetail(fake, 'user-1', 'ex-none')) === null)
  const baselines = await fetchWeightTimePRBaselines(fake, 'user-1', ['ex-wt', 'ex-wr'], 's3')
  check('J10: PR baselines exclude the current session s3 and non-weight_time exercises: ex-wt → (20,60),(0,120),(25,70); no ex-wr entry',
    baselines['ex-wr'] === undefined && JSON.stringify(baselines['ex-wt']) === JSON.stringify([{ weightKg: 20, durationSeconds: 60 }, { weightKg: 0, durationSeconds: 120 }, { weightKg: 25, durationSeconds: 70 }]), JSON.stringify(baselines))
  const collectedCount = collectWeightTimePerformances(sessions).get('ex-wt')?.performances.length
  check('J11: the raw adapter collects exactly the four qualifying performances (w1, w3, w5, w7)', collectedCount === 4)

  console.log('\nK. Edit semantics — records derive from current set values')
  const edited = structuredClone(sessions)
  edited[0].workout_exercises[0].workout_sets[1].is_warmup = false // the (50,200) warm-up becomes a working set
  const editedSummary = collectWeightTimePerformances(edited).get('ex-wt')!
  const recomputed = summarizeWeightTimePerformances(editedSummary.performances)
  check('K1: flipping the warm-up flag on the stored set recomputes records on the next read — (50,200) is now the longest AND heaviest hold and a PR', recomputed.longestHold?.setId === 'w2' && recomputed.heaviestHold?.setId === 'w2' && recomputed.prEvents.some((event) => event.setId === 'w2'))

  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
