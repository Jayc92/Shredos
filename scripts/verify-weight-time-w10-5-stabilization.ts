// ============================================================
// ForgeFitOS — W10.5 verifier: the seven design-call dispositions
// (W8–W10 checkpoint disposition, 2026-09-10, section W10.5-A).
//
//   1. representativeHold — the single deterministic hold an existing
//      surface needs is named/treated as a representative, never a "best
//      set" / "best performance" / "top set", and feeds no ranking.
//   2. First-ever qualifying hold IS a Weight-time PR — preserved.
//   3. Incomparable latest-vs-previous is NEVER "Steady"/"Same"/Up/Down:
//      the comparison names the dimensional change (heavier_shorter /
//      lighter_longer); the typed overview surface uses the non-ranking
//      category 'mixed', proven neutral (label, icon, colour, sort band,
//      counts, notable selection).
//   4. Guidance emits ONE approved sentence (duration); the next-weight
//      sentence is never emitted automatically; RPE irrelevant.
//   5. No weight_time trend chart.
//   6. Recent PRs merge — deterministic chronological merge, no
//      double-counting across models, explicit cap, and with ZERO
//      weight_time data the output is identical to pre-W8 behaviour
//      (proven against the pre-W8 page source at bf3bc020).
//   7. Local completion refusal retained.
//
// Executes the real modules (workout.ts, weight-time-records.ts,
// progress-overview.ts, weekly-review.ts, recent-pr-tiles.ts,
// strength-records.ts) and renders the real components with
// react-dom/server. Never contacts Supabase, Vercel or any remote service.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w10-5-stabilization.ts
// ============================================================

import path from 'node:path'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// tsconfig `jsx: preserve` → classic runtime under tsx; React must be in scope before the components load.
;(globalThis as unknown as { React: typeof React }).React = React

import {
  pickRepresentativeHold, compareWeightTimeSets, describeWeightTimeComparison, weightTimeComparisonDetail,
  trackingAwareProgressSignal, suggestNextTarget, formatDurationSeconds, formatAddedWeightLb,
  WEIGHT_TIME_HOLD_LONGER_GUIDANCE, WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE,
} from '../src/lib/workout'
import { compareWeightTimeHolds, reconstructWeightTimePREvents, fetchWeightTimeRecords } from '../src/lib/weight-time-records'
import type { WeightTimePerformance, WeightTimePREvent, WeightTimeRawSession } from '../src/lib/weight-time-records'
import { buildExerciseProgressOverview, sortOverviewRows } from '../src/lib/progress-overview'
import type { ExerciseProgressOverviewRow, RawOverviewSession } from '../src/lib/progress-overview'
import { computeWeeklyExerciseProgress, selectNotableExercises } from '../src/lib/weekly-review'
import { buildRecentPRTiles, mergeRecentPRTiles, strengthPRTile, weightTimePRTile, RECENT_PR_TILE_CAP } from '../src/lib/recent-pr-tiles'
import type { RecentPRTile } from '../src/lib/recent-pr-tiles'
import { fetchStrengthRecords } from '../src/lib/strength-records'
import type { PREvent } from '../src/lib/strength-records'
import { lbsToKg, kgToLbs } from '../src/lib/units'
import type { WorkoutSet, TrackingMode } from '../src/types/database'

const repositoryRoot = process.cwd()
let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (relative: string): string => readFileSync(path.join(repositoryRoot, relative), 'utf8')
const stripComments = (text: string): string => text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
const strip = (html: string): string => html.replace(/<[^>]+>/g, '|')

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
  console.log('W10.5 verification — the seven design-call dispositions')
  console.log(`root=${repositoryRoot}`)

  const { WeightTimeComparisonBadge } = await import('../src/components/workout/WeightTimeComparisonBadge')
  const { WeightTimeSections } = await import('../src/components/progress/WeightTimeSections')

  console.log('\n1. representativeHold — naming and treatment')
  setCounter = 0
  const h1 = hold(20, 60); const h2 = hold(10, 90); const h3 = hold(30, 90)
  check('1a: rule — longest duration; tie → higher added weight; remaining tie → historical order (lower set_number)',
    pickRepresentativeHold([h1, h2, h3])?.id === h3.id && pickRepresentativeHold([hold(30, 90, { set_number: 9, id: 'later' }), hold(30, 90, { set_number: 2, id: 'earlier' })])?.id === 'earlier')
  const workoutSource = read('src/lib/workout.ts')
  const weightTimeFiles = ['src/lib/weight-time-records.ts', 'src/components/progress/WeightTimeSections.tsx', 'src/components/workout/WeightTimeSetInputs.tsx', 'src/components/workout/WeightTimeComparisonBadge.tsx', 'src/lib/recent-pr-tiles.ts']
  check('1b: the function is named pickRepresentativeHold; the old set-oriented name is gone from src and scripts',
    workoutSource.includes('export function pickRepresentativeHold(') && !/pickRepresentativeWeightTimeSet/.test(execSync('grep -rl "pickRepresentativeWeightTimeSet" src scripts || true', { encoding: 'utf8' })))
  const holdBody = stripComments(workoutSource.slice(workoutSource.indexOf('export function pickRepresentativeHold('), workoutSource.indexOf('export function weightTimePointOf(')))
  check('1c: pickRepresentativeHold\'s executable body never names a "best" and never calls setScore/bestSet',
    !/\bbest/i.test(holdBody) && !/setScore|bestSet/.test(holdBody))
  check('1d: no weight_time module or component calls its object a best set / best performance / top set (executable text)',
    weightTimeFiles.every((file) => !/best set|best performance|top set|\bbestSet\b|\bbest\b/i.test(stripComments(read(file)))))
  const block = stripComments(read('src/components/workout/WorkoutExerciseBlock.tsx'))
  // W12-R2-1 RETARGET. The W10.5 assertion is unchanged: the exercise block
  // keeps the hold in its own named local, and weight_time never flows through
  // curBest or bestSet. Only the two NAMES moved. The F5 ruling accepted this
  // comparison's behaviour but required the terminology to state its scope,
  // because `representativeHold` read as "this session's" and this local has
  // never been that — it is ONE workout_exercises block's anchor, used only for
  // that block's comparison badge. The scope contract itself (block-local,
  // never the session representative, never PR truth) is asserted in
  // verify-weight-time-w12-r2.ts.
  check('1e: the exercise block holds the hold in blockRepresentativeHold / previousSessionRepresentativeHold and weight_time never flows through curBest or bestSet',
    block.includes('const blockRepresentativeHold = isWeightTime ? pickRepresentativeHold(sets) : null') && block.includes('const previousSessionRepresentativeHold = isWeightTime ? previousBest : null')
    && /const curBest = isWeightTime\s*\? null/.test(block) && /const signal  = isWeightTime\s*\? null/.test(block))
  const server = stripComments(read('src/lib/supabase/server.ts'))
  // W12-R1-3(A) RETARGET. The W10.5 vocabulary assertion is unchanged and
  // strengthened: no localBest/bestInSession local survives, legacy modes still
  // route through the shared pickRepresentativeSet rule, and its weight_time arm
  // still returns pickRepresentativeHold. Only the declaration moved — the
  // single `const representative = pickRepresentativeSet(...)` became a `let`
  // assigned in either arm, because fetchPreviousBests now merges every block of
  // a session before selecting that session's representative instead of letting
  // the first block PostgREST happened to return decide it. The declaration is
  // typed `PreviousBestSetRow | null` rather than `any`: the merged arm needs a
  // named row type for its id->row map, so annotating it cost nothing and kept
  // the lint warning budget from growing.
  check('1f: server.ts speaks of representatives — no localBest/bestInSession locals remain; the weight_time arm uses pickRepresentativeHold',
    !/localBest|bestInSession/.test(server) && /let representative: PreviousBestSetRow \| null = null/.test(server)
    && server.includes('representative = pickRepresentativeSet(working, trackingMode)') && /case 'weight_time':\s*return pickRepresentativeHold\(/.test(server)
    && server.includes('const hold = selectLongestHold(performances)'))
  // W12-R2-1: the negative regexes matched the literal name `representativeHold`
  // and would have gone on passing vacuously once the local became
  // blockRepresentativeHold — the ban would have covered a name that no longer
  // exists. They now match ANY *representativeHold local, which is strictly more
  // than the W10.5 version covered: a strengthening, not an admission.
  check('1g: no *representativeHold feeds a scalar — workout.ts has no weight × duration product and no such local is ever passed to setScore/progressSignal/classifyTrend',
    !/(weight_kg|weightKg)\s*\*\s*(duration_seconds|durationSeconds)/.test(stripComments(workoutSource))
    && !/setScore\([A-Za-z]*[Rr]epresentativeHold|progressSignal\([A-Za-z]*[Rr]epresentativeHold|classifyTrend\(.*[Rr]epresentativeHold/.test(block))

  console.log('\n2. First-ever qualifying hold is a Weight-time PR — preserved')
  const first: WeightTimePerformance = { setId: 'p1', exerciseId: 'ex', sessionId: 's1', workoutDate: '2026-09-01', sessionCreatedAt: '2026-09-01T10:00:00Z', orderIndex: 0, setNumber: 1, weightKg: 0, durationSeconds: 30, rpe: null }
  check('2a: a lone first qualifying hold (even 0 lb added, 0:30) is a PR event', reconstructWeightTimePREvents([first]).length === 1 && reconstructWeightTimePREvents([first])[0].setId === 'p1')
  check('2b: its exact repeat is not, a dominating follow-up is', reconstructWeightTimePREvents([first, { ...first, setId: 'p2', setNumber: 2 }, { ...first, setId: 'p3', setNumber: 3, durationSeconds: 45 }]).map((e) => e.setId).join(',') === 'p3,p1')

  console.log('\n3. Incomparable pairs — the dimensional change, never a direction')
  check('3a: compareWeightTimeHolds: dominance → improved/declined, exact repeat → same, trade-offs → heavier_shorter / lighter_longer',
    compareWeightTimeHolds({ weightKg: 25, durationSeconds: 70 }, { weightKg: 20, durationSeconds: 60 }) === 'improved' && compareWeightTimeHolds({ weightKg: 15, durationSeconds: 50 }, { weightKg: 20, durationSeconds: 60 }) === 'declined'
    && compareWeightTimeHolds({ weightKg: 20, durationSeconds: 60 }, { weightKg: 20, durationSeconds: 60 }) === 'same'
    && compareWeightTimeHolds({ weightKg: 30, durationSeconds: 40 }, { weightKg: 20, durationSeconds: 60 }) === 'heavier_shorter' && compareWeightTimeHolds({ weightKg: 10, durationSeconds: 90 }, { weightKg: 20, durationSeconds: 60 }) === 'lighter_longer')
  check('3b: a trade-off is never reported as same/improved/declined for ANY incomparable pair (grid of 400 pairs)', (() => {
    for (let w = 1; w <= 20; w += 1) for (let d = 1; d <= 20; d += 1) {
      const latest = { weightKg: w, durationSeconds: d }, previous = { weightKg: 10, durationSeconds: 10 }
      const c = compareWeightTimeHolds(latest, previous)
      const incomparable = (w > 10 && d < 10) || (w < 10 && d > 10)
      if (incomparable && (c === 'same' || c === 'improved' || c === 'declined')) return false
      if (!incomparable && (c === 'heavier_shorter' || c === 'lighter_longer')) return false
    }
    return true
  })())
  check('3c: wording names both dimensions and carries no direction word', describeWeightTimeComparison('heavier_shorter') === 'Heavier, shorter' && describeWeightTimeComparison('lighter_longer') === 'Lighter, longer' && !/up|down|improv|declin|steady|same/i.test(describeWeightTimeComparison('heavier_shorter') + describeWeightTimeComparison('lighter_longer')))
  check('3d: weightTimeComparisonDetail exists only for trade-offs', weightTimeComparisonDetail('heavier_shorter') === 'heavier, shorter than the previous session' && weightTimeComparisonDetail('lighter_longer') === 'lighter, longer than the previous session' && weightTimeComparisonDetail('improved') === null && weightTimeComparisonDetail('same') === null)
  check('3e: trackingAwareProgressSignal refuses weight_time (fail-closed), so no ProgressSignal can ever be produced for a hold', (() => { try { trackingAwareProgressSignal(hold(30, 40), hold(20, 60), 'weight_time'); return false } catch { return true } })())
  // Overview surface
  const meta = (id: string, mode: TrackingMode) => ({ id, name: id, primary_muscle: 'core' as never, equipment: null, tracking_mode: mode, unilateral: false })
  const raw = (o: Partial<RawOverviewSession['workout_exercises'][number]['workout_sets'][number]>) => ({ set_number: 1, reps: null, weight_kg: null, rpe: null, is_warmup: false, completed: true, duration_seconds: null, distance_meters: null, ...o })
  const sessions: RawOverviewSession[] = [
    { workout_date: '2026-09-08', workout_exercises: [
      { exercise_id: 'carry', exercise: meta('carry', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(30), duration_seconds: 40 })] },
      { exercise_id: 'plank', exercise: meta('plank', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(10), duration_seconds: 90 })] },
      { exercise_id: 'hold', exercise: meta('hold', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(20), duration_seconds: 60 })] },
      { exercise_id: 'bench', exercise: meta('bench', 'weight_reps'), workout_sets: [raw({ weight_kg: lbsToKg(225), reps: 5 })] },
    ] },
    { workout_date: '2026-09-01', workout_exercises: [
      { exercise_id: 'carry', exercise: meta('carry', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(20), duration_seconds: 60 })] },
      { exercise_id: 'plank', exercise: meta('plank', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(20), duration_seconds: 60 })] },
      { exercise_id: 'hold', exercise: meta('hold', 'weight_time'), workout_sets: [raw({ weight_kg: lbsToKg(20), duration_seconds: 60 })] },
      { exercise_id: 'bench', exercise: meta('bench', 'weight_reps'), workout_sets: [raw({ weight_kg: lbsToKg(225), reps: 5 })] },
    ] },
  ]
  const rows = buildExerciseProgressOverview(sessions)
  const carry = rows.find((r) => r.exerciseId === 'carry')!, plank = rows.find((r) => r.exerciseId === 'plank')!, holdRow = rows.find((r) => r.exerciseId === 'hold')!, bench = rows.find((r) => r.exerciseId === 'bench')!
  check('3f: overview — heavier/shorter → mixed + "heavier, shorter…"; lighter/longer → mixed + "lighter, longer…"; exact repeat → same; strength repeat → same (legacy)',
    carry.status === 'mixed' && carry.statusDetail === 'heavier, shorter than the previous session' && plank.status === 'mixed' && plank.statusDetail === 'lighter, longer than the previous session' && holdRow.status === 'same' && holdRow.statusDetail === null && bench.status === 'same')
  const mk = (id: string, status: ExerciseProgressOverviewRow['status'], date: string): ExerciseProgressOverviewRow => ({ exerciseId: id, exerciseName: id, trackingMode: 'weight_time', primaryMuscle: null, equipment: null, isUnilateral: false, latestWorkoutDate: date, recentSessionCount: 2, latestSummary: '', secondarySummary: null, status, statusDetail: null })
  const sorted = sortOverviewRows([mk('m-old', 'mixed', '2026-09-01'), mk('d', 'declined', '2026-09-09'), mk('s-new', 'same', '2026-09-08'), mk('i', 'improved', '2026-09-01'), mk('m-new', 'mixed', '2026-09-09'), mk('s-old', 'same', '2026-09-02'), mk('n', 'needs_data', '2026-09-09')]).map((r) => r.exerciseId).join(',')
  check('3g: sort — mixed shares the non-directional band with same (interleaved by recency), after improved and before declined; it ranks neither above nor below steady', sorted === 'i,m-new,s-new,s-old,m-old,d,n', sorted)
  const weekly = computeWeeklyExerciseProgress(sessions, { startDate: '2026-09-08', endDate: '2026-09-14' } as never)
  check('3h: weekly review counts mixed separately — never as improving, steady or declining — and never selects a mixed row as notable',
    weekly.mixed === 2 && weekly.steady === 2 && weekly.improving === 0 && weekly.declining === 0 && selectNotableExercises(sortOverviewRows(rows)).every((r) => r.status !== 'mixed'))
  const progressPage = read('src/app/(app)/progress/page.tsx'), checkInPage = read('src/app/(app)/check-in/page.tsx')
  check('3i: both typed status surfaces label mixed "Mixed" with the bidirectional ArrowLeftRight icon (never TrendingUp/Down/MoveRight) and borrow the neutral \'same\' colour tokens',
    [progressPage, checkInPage].every((page) => page.includes("mixed: { label: 'Mixed', Icon: ArrowLeftRight }") && page.includes("status === 'mixed' ? 'same' : status")))
  check('3j: the overview card spells out the dimensional change under the badge; the check-in page counts mixed in its total and shows it as its own tile', progressPage.includes('{row.statusDetail && (') && checkInPage.includes('exerciseProgress.mixed +') && checkInPage.includes('mixed (two-dimensional)'))
  check('3k: the improving and needs-data summary tiles never count a mixed row', progressPage.includes("overviewRows.filter((r) => r.status === 'improved').length") && progressPage.includes("overviewRows.filter((r) => r.status === 'needs_data').length") && !/status === 'mixed'\)\.length/.test(progressPage))
  const mixedBadge = renderToStaticMarkup(React.createElement(WeightTimeComparisonBadge, { comparison: 'heavier_shorter', previousSummary: '1:00 · 20 lb added' }))
  const improvedBadge = renderToStaticMarkup(React.createElement(WeightTimeComparisonBadge, { comparison: 'improved' }))
  check('3l: the active-workout badge for a trade-off reads "Heavier, shorter" with the bidirectional icon and the sunken/ink-muted (neutral) tokens; a dominating hold reuses the shared "Improved" badge',
    strip(mixedBadge).includes('Heavier, shorter') && /lucide-arrow-left-right/.test(mixedBadge) && /bg-surface-sunken text-ink-muted border-edge/.test(mixedBadge) && !/lucide-trending|lucide-move-right|success|critical/.test(mixedBadge)
    && strip(improvedBadge).includes('Improved') && /lucide-trending-up/.test(improvedBadge))
  const detail = { exerciseId: 'ex', exerciseName: 'Carry', isUnilateral: false, summary: { longestHold: null, heaviestHold: null, frontier: [], prEvents: [], qualifyingCount: 2 }, history: [],
    // W12-R1-3(B) rename only — one hold per session, so each is its session's representative.
    latestSessionRepresentative: { setId: 'a', exerciseId: 'ex', sessionId: 's2', workoutDate: '2026-09-08', sessionCreatedAt: '2026-09-08T10:00:00Z', orderIndex: 0, setNumber: 1, weightKg: lbsToKg(30), durationSeconds: 40, rpe: null },
    previousSessionRepresentative: { setId: 'b', exerciseId: 'ex', sessionId: 's1', workoutDate: '2026-09-01', sessionCreatedAt: '2026-09-01T10:00:00Z', orderIndex: 0, setNumber: 1, weightKg: lbsToKg(20), durationSeconds: 60, rpe: null } }
  const sectionsText = strip(renderToStaticMarkup(React.createElement(WeightTimeSections, { detail, recentEntries: [], isUnilateral: false })))
  check('3m: the progress detail page says "Vs. previous session: Heavier, shorter" — never Same/Steady/Improved/Declined for a trade-off', sectionsText.includes('Vs. previous session: Heavier, shorter') && !/Vs\. previous session: (Same|Steady|Improved|Declined)/.test(sectionsText))

  console.log('\n4. Guidance — one dimension at a time')
  check('4a: the default guidance is exactly the duration sentence', suggestNextTarget(hold(20, 60), false, 'weight_time', null).message === WEIGHT_TIME_HOLD_LONGER_GUIDANCE && WEIGHT_TIME_HOLD_LONGER_GUIDANCE === 'Try holding this weight slightly longer.')
  check('4b: the next-weight sentence is never emitted automatically — long holds, heavy holds, frontier-like points, any RPE, any trend, unilateral or not',
    [hold(0, 900), hold(300, 3), hold(20, 60, { rpe: 2 }), hold(20, 60, { rpe: 10 }), hold(45, 120)].every((previous) => [undefined, 'improving', 'steady', 'stalling', 'needs-data'].every((trend) => [true, false].every((uni) => !suggestNextTarget(previous, uni, 'weight_time', 'weight_plate' as never, trend as never).message.includes(WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE)))))
  check('4c: RPE is irrelevant to the choice (identical messages for RPE 2, 10 and none)', new Set([2, 10, null].map((rpe) => suggestNextTarget(hold(20, 60, { rpe }), false, 'weight_time', null).message)).size === 1)
  check('4d: the approved second sentence stays pinned as a constant for a future truthful criterion, but no automatic path references it', WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE === 'When this duration feels controlled, try the next available weight.' && !stripComments(workoutSource).slice(workoutSource.indexOf('function buildWeightTimeNextTarget')).split('\n').slice(0, 12).join('\n').includes('WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE'))
  check('4e: the detail page renders the single sentence and not the second', sectionsText.includes(WEIGHT_TIME_HOLD_LONGER_GUIDANCE) && !sectionsText.includes(WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE))

  console.log('\n5. No weight_time trend chart')
  check('5a: WeightTimeSections imports no chart and renders no <svg>; the detail page routes weight_time away from the chart builders', !/ExerciseTrendChart|progress-charts/.test(read('src/components/progress/WeightTimeSections.tsx')) && !/<svg/.test(sectionsText) && /isWeightTime \? \(\s*<WeightTimeSections/.test(read('src/app/(app)/progress/exercises/[id]/page.tsx')))

  console.log('\n6. Recent PRs merge')
  const strengthEvents: PREvent[] = [
    { workoutDate: '2026-09-09', exerciseId: 'bench', exerciseName: 'Bench', isUnilateral: false, type: 'weight', weightKg: lbsToKg(230), reps: 5, estimated1RmKg: null },
    { workoutDate: '2026-09-09', exerciseId: 'row', exerciseName: 'Row', isUnilateral: true, type: 'estimated_1rm', weightKg: lbsToKg(90), reps: 8, estimated1RmKg: lbsToKg(114) },
    { workoutDate: '2026-09-05', exerciseId: 'pushup', exerciseName: 'Push-up', isUnilateral: false, type: 'bodyweight_reps', weightKg: null, reps: 25, estimated1RmKg: null },
    { workoutDate: '2026-09-01', exerciseId: 'bench', exerciseName: 'Bench', isUnilateral: false, type: 'weight', weightKg: lbsToKg(225), reps: 5, estimated1RmKg: null },
  ]
  // The pre-W8 inline mapping, reproduced from the page source at bf3bc020 (asserted below to be that source's exact expressions).
  const legacyTile = (e: PREvent) => {
    const suffix = e.isUnilateral ? ' per side' : ''
    const typeLabel = e.type === 'weight' ? 'Weight PR' : e.type === 'estimated_1rm' ? 'Est. 1RM PR' : 'Rep PR'
    const valueText = e.type === 'weight'
      ? `${Math.round(kgToLbs(e.weightKg as number))} lbs${e.reps !== null ? ` × ${e.reps}` : ''}${suffix}`
      : e.type === 'estimated_1rm' ? `${Math.round(kgToLbs(e.estimated1RmKg as number))} lbs${suffix}` : `${e.reps} reps${suffix}`
    return { typeLabel, workoutDate: e.workoutDate, exerciseName: e.exerciseName, valueText }
  }
  const preW8Page = execSync(`git -C "${repositoryRoot}" show bf3bc020:"src/app/(app)/progress/page.tsx"`, { encoding: 'utf8' })
  check('6a: the legacy mapping used here is the pre-W8 page\'s own (bf3bc020): its typeLabel/valueText expressions appear verbatim in that historical source',
    preW8Page.includes("e.type === 'weight' ? 'Weight PR'") && preW8Page.includes(": e.type === 'estimated_1rm' ? 'Est. 1RM PR'") && preW8Page.includes(": 'Rep PR'")
    && preW8Page.includes("? `${Math.round(kgToLbs(e.weightKg as number))} lbs${") && preW8Page.includes("e.reps !== null ? ` × ${e.reps}` : ''") && preW8Page.includes("? `${Math.round(kgToLbs(e.estimated1RmKg as number))} lbs${suffix}`") && preW8Page.includes(": `${e.reps} reps${suffix}`")
    && preW8Page.includes('{strengthRecords.recentPREvents.map((e, i) => {') && preW8Page.includes('{strengthRecords.recentPREvents.length}'))
  const noWeightTime = buildRecentPRTiles(strengthEvents, [])
  const projected = noWeightTime.map(({ typeLabel, workoutDate, exerciseName, valueText }) => ({ typeLabel, workoutDate, exerciseName, valueText }))
  check('6b: ZERO weight_time data → the merged list is IDENTICAL to the pre-W8 output: same count, same order, same labels and values', JSON.stringify(projected) === JSON.stringify(strengthEvents.map(legacyTile)) && noWeightTime.length === strengthEvents.length, JSON.stringify(projected))
  check('6c: with zero weight_time data the count tile (tiles.length) equals the legacy strengthRecords.recentPREvents.length', noWeightTime.length === strengthEvents.length && progressPage.includes('{recentPRTiles.length}'))
  const weightTimeEvents: WeightTimePREvent[] = [
    { setId: 'w-3', exerciseId: 'carry', exerciseName: 'Carry', isUnilateral: true, workoutDate: '2026-09-09', weightKg: lbsToKg(30), durationSeconds: 40 },
    { setId: 'w-2', exerciseId: 'carry', exerciseName: 'Carry', isUnilateral: true, workoutDate: '2026-09-07', weightKg: lbsToKg(20), durationSeconds: 60 },
    { setId: 'w-1', exerciseId: 'plank', exerciseName: 'Plank', isUnilateral: false, workoutDate: '2026-09-01', weightKg: 0, durationSeconds: 120 },
  ]
  const merged = buildRecentPRTiles(strengthEvents, weightTimeEvents)
  check('6d: deterministic chronological merge — dates never ascend; on an equal date the strength tile precedes; each source keeps its internal order',
    merged.every((tile, index) => index === 0 || merged[index - 1].workoutDate >= tile.workoutDate)
    && merged.map((t) => t.key).join('|') === [...strengthEvents.slice(0, 2).map(strengthPRTile), weightTimePRTile(weightTimeEvents[0]), weightTimePRTile(weightTimeEvents[1]), strengthPRTile(strengthEvents[2]), strengthPRTile(strengthEvents[3]), weightTimePRTile(weightTimeEvents[2])].map((t) => t.key).join('|'), merged.map((t) => `${t.model}:${t.workoutDate}`).join(' '))
  check('6e: same input → same output (determinism) and the Weight-time tile reads both dimensions with the O5 phrase and per-side suffix',
    JSON.stringify(buildRecentPRTiles(strengthEvents, weightTimeEvents)) === JSON.stringify(merged) && merged.find((t) => t.key === 'weight_time:w-3')?.valueText === `${formatDurationSeconds(40)} · ${formatAddedWeightLb(lbsToKg(30))} per side` && merged.find((t) => t.key === 'weight_time:w-1')?.valueText === '2:00 · 0 lb added')
  check('6f: no double counting — every key is unique and model-prefixed', new Set(merged.map((t) => t.key)).size === merged.length && merged.every((t) => t.key.startsWith(`${t.model}:`)))
  const many: RecentPRTile[] = Array.from({ length: 10 }, (_, i) => strengthPRTile({ ...strengthEvents[0], workoutDate: `2026-08-${String(20 - i).padStart(2, '0')}`, exerciseId: `s${i}` }))
  const manyWeightTime: RecentPRTile[] = Array.from({ length: 5 }, (_, i) => weightTimePRTile({ ...weightTimeEvents[0], setId: `wt${i}`, workoutDate: `2026-08-${String(25 - i).padStart(2, '0')}` }))
  const capped = mergeRecentPRTiles(many, manyWeightTime)
  check('6g: the cap is explicit (RECENT_PR_TILE_CAP = 10) — 10 strength + 5 weight_time → exactly the ten most recent', RECENT_PR_TILE_CAP === 10 && capped.length === 10 && capped.slice(0, 5).every((t) => t.model === 'weight_time') && capped.every((t, i) => i === 0 || capped[i - 1].workoutDate >= t.workoutDate))
  // Structural disjointness: both readers over ONE dataset never claim the same exercise.
  const dataset: WeightTimeRawSession[] = [
    { id: 's1', workout_date: '2026-09-01', created_at: '2026-09-01T10:00:00Z', workout_exercises: [
      { id: 'we1', exercise_id: 'ex-wt', order_index: 0, exercise: { id: 'ex-wt', name: 'Carry', tracking_mode: 'weight_time', unilateral: false, exercise_type: 'strength' } as never, workout_sets: [{ id: 'a1', set_number: 1, weight_kg: 20, duration_seconds: 60, rpe: null, is_warmup: false, completed: true, reps: null } as never] },
      { id: 'we2', exercise_id: 'ex-wr', order_index: 1, exercise: { id: 'ex-wr', name: 'Bench', tracking_mode: 'weight_reps', unilateral: false, exercise_type: 'strength' } as never, workout_sets: [{ id: 'b1', set_number: 1, weight_kg: 100, duration_seconds: null, rpe: null, is_warmup: false, completed: true, reps: 5 } as never] },
    ] },
    { id: 's2', workout_date: '2026-09-08', created_at: '2026-09-08T10:00:00Z', workout_exercises: [
      { id: 'we3', exercise_id: 'ex-wt', order_index: 0, exercise: { id: 'ex-wt', name: 'Carry', tracking_mode: 'weight_time', unilateral: false, exercise_type: 'strength' } as never, workout_sets: [{ id: 'a2', set_number: 1, weight_kg: 25, duration_seconds: 70, rpe: null, is_warmup: false, completed: true, reps: null } as never] },
      { id: 'we4', exercise_id: 'ex-wr', order_index: 1, exercise: { id: 'ex-wr', name: 'Bench', tracking_mode: 'weight_reps', unilateral: false, exercise_type: 'strength' } as never, workout_sets: [{ id: 'b2', set_number: 1, weight_kg: 105, duration_seconds: null, rpe: null, is_warmup: false, completed: true, reps: 5 } as never] },
    ] },
  ]
  class FakeQuery {
    select(): this { return this }
    eq(): this { return this }
    neq(): this { return this }
    order(): this { return this }
    then<T>(onFulfilled: (value: { data: unknown; error: null }) => T): Promise<T> { return Promise.resolve({ data: structuredClone(dataset), error: null }).then(onFulfilled) }
  }
  const fake = { from: () => new FakeQuery() }
  const strength = await fetchStrengthRecords(fake as never, 'user-1')
  const weightTime = await fetchWeightTimeRecords(fake, 'user-1')
  const strengthIds = new Set(strength.recentPREvents.map((e) => e.exerciseId)), weightTimeIds = new Set(weightTime.recentPREvents.map((e) => e.exerciseId))
  check('6h: over one dataset the two models claim DISJOINT exercises (strength: weight_reps only; weight_time: weight_time only), so no set can be double-counted',
    strengthIds.has('ex-wr') && !strengthIds.has('ex-wt') && weightTimeIds.has('ex-wt') && !weightTimeIds.has('ex-wr') && Array.from(strengthIds).every((id) => !weightTimeIds.has(id)))
  check('6i: the page delegates to buildRecentPRTiles and renders the merged list', progressPage.includes('const recentPRTiles = buildRecentPRTiles(strengthRecords.recentPREvents, weightTimeRecords.recentPREvents)') && progressPage.includes('recentPRTiles.map((tile) =>'))

  console.log('\n7. Local completion refusal — retained')
  const setRow = stripComments(read('src/components/workout/SetRow.tsx'))
  check('7a: SetRow still refuses a weight_time completion locally with the contract\'s completionError and renders the reason with role="alert"; server/DB remain authoritative (the route error is surfaced too)',
    setRow.includes("return completionError('weight_time', { reps: null, weightKg, durationSeconds, isWarmup })") && /if \(next && showWeightTimeInputs\) \{\s*const blocker = weightTimeCompletionBlocker\(\)\s*if \(blocker\) \{ setCompletionMessage\(blocker\); return \}/.test(setRow) && /role="alert"/.test(setRow) && /setCompletionMessage\(body\.error\)/.test(setRow))

  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
