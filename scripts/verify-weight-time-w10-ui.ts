// ============================================================
// ForgeFitOS — W10 verifier: weight_time user-facing UI.
// (docs/weight-time-coordinated-implementation-plan.md §4.1, §4.2, §9, §16 W10.)
//
// Proves the W10 surfaces two ways:
//   * RENDER — the two pure components (WeightTimeSetInputs, the set-entry
//     input group; WeightTimeSections, the progress detail body) are
//     rendered to static markup with react-dom/server over fixtures, so
//     the accessible names, the visible zero, the "per side" suffix, the
//     read-only attributes, the three distinct record concepts, the
//     frontier order and the "Weight-time PR" copy are observed in real
//     output, not inferred from source.
//   * SOURCE — the stateful/hook-bearing surfaces (SetRow, the exercise
//     block, the pages, the contract, the label list) are checked against
//     their executable text: what renders for weight_time, what never
//     does (reps, distance), how completion is refused, which PR model
//     labels a hold, and that the legacy modes keep their exact markup.
//
// Never contacts Supabase, Vercel, or any remote service. Needs no
// browser and no dev server.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w10-ui.ts
// ============================================================

import path from 'node:path'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// tsconfig.json sets `jsx: preserve` for Next; under tsx that compiles the
// components' JSX with the classic runtime, which expects `React` in scope.
// Provide it globally BEFORE the components are loaded (dynamic imports below).
;(globalThis as unknown as { React: typeof React }).React = React

import { TRACKING_MODES } from '../src/lib/constants'
import {
  MODE_COPY_FIELDS, MODE_APPLY_REQUIRED_FIELDS, applyTemplateReady, WARMUP_FORBIDDEN_MODES,
  ADDED_WEIGHT_REQUIRED_ERROR, DURATION_REQUIRED_ERROR,
} from '../src/lib/workout-set-contract'
import { WEIGHT_TIME_HOLD_LONGER_GUIDANCE, WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE } from '../src/lib/workout'
import { lbsToKg } from '../src/lib/units'
import type { WeightTimeExerciseDetail, WeightTimePerformance } from '../src/lib/weight-time-records'
import { summarizeWeightTimePerformances } from '../src/lib/weight-time-records'

const repositoryRoot = process.cwd()
let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (relative: string): string => readFileSync(path.join(repositoryRoot, relative), 'utf8')
const stripComments = (text: string): string => text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
const countOf = (text: string, pattern: RegExp): number => (text.match(pattern) || []).length
/** All <input …> tags of a markup string, each as its attribute text. */
const inputsOf = (html: string): string[] => (html.match(/<input\b[^>]*>/g) || [])
const ariaLabelsOf = (html: string): string[] => inputsOf(html).map((tag) => /aria-label="([^"]*)"/.exec(tag)?.[1] ?? '')
// Emoji as UTF-16: astral symbols are surrogate pairs (U+D83C–U+D83E lead);
// the misc-symbols/dingbats blocks are BMP. No `u` flag (tsconfig targets ES5).
const EMOJI = /[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿]/

async function main(): Promise<number> {
  console.log('W10 verification — weight_time user-facing UI')
  console.log(`root=${repositoryRoot}`)

  const { WeightTimeSetInputs } = await import('../src/components/workout/WeightTimeSetInputs')
  const { WeightTimeSections } = await import('../src/components/progress/WeightTimeSections')

  console.log('\nA. The tracking-mode label')
  const weightTimeOption = TRACKING_MODES.find((option) => option.value === 'weight_time')
  check('A1: TRACKING_MODES carries exactly one weight_time entry labelled "Weight + Time"', weightTimeOption?.label === 'Weight + Time' && TRACKING_MODES.filter((option) => option.value === 'weight_time').length === 1)
  check('A2: the four legacy labels are unchanged and the list has five entries', TRACKING_MODES.length === 5 && ['Weight & reps', 'Bodyweight', 'Cardio', 'Timed'].every((label) => TRACKING_MODES.some((option) => option.label === label)))
  check('A3: ExerciseForm\'s mode PillGroup and the /progress filter pills both read TRACKING_MODES (the label makes the mode selectable everywhere at once)',
    /PillGroup[\s\S]{0,200}options=\{TRACKING_MODES\}/.test(read('src/components/workout/ExerciseForm.tsx')) && read('src/app/(app)/progress/page.tsx').includes('TRACKING_MODES.map((m) =>'))

  console.log('\nB. Shared Apply contract — one definition for route and client')
  check('B1: MODE_COPY_FIELDS.weight_time = weight_kg, duration_seconds, rpe (no reps, no distance)', JSON.stringify(MODE_COPY_FIELDS.weight_time) === JSON.stringify(['weight_kg', 'duration_seconds', 'rpe']))
  check('B2: MODE_APPLY_REQUIRED_FIELDS.weight_time requires BOTH added weight and duration', JSON.stringify(MODE_APPLY_REQUIRED_FIELDS.weight_time) === JSON.stringify(['weight_kg', 'duration_seconds']))
  check('B3: applyTemplateReady — 0 added weight + duration READY; null weight NOT ready; missing duration NOT ready; null template NOT ready',
    applyTemplateReady('weight_time', { weight_kg: 0, duration_seconds: 60 }) === true
    && applyTemplateReady('weight_time', { weight_kg: null, duration_seconds: 60 }) === false
    && applyTemplateReady('weight_time', { weight_kg: 0, duration_seconds: null }) === false
    && applyTemplateReady('weight_time', null) === false)
  check('B4: legacy eligibility unchanged — weight_reps reps+weight, bodyweight reps, cardio/timed duration',
    applyTemplateReady('weight_reps', { reps: 5, weight_kg: 100 }) && !applyTemplateReady('weight_reps', { reps: 5, weight_kg: null })
    && applyTemplateReady('bodyweight', { reps: 12, weight_kg: null }) && applyTemplateReady('cardio', { duration_seconds: 600 }) && applyTemplateReady('timed', { duration_seconds: 60 }) && !applyTemplateReady('timed', { duration_seconds: null }))
  const applyRoute = read('src/app/api/workout-exercises/[id]/apply-first-set/route.ts')
  const block = read('src/components/workout/WorkoutExerciseBlock.tsx')
  check('B5: the apply-first-set route imports MODE_COPY_FIELDS and carries no local copy list', applyRoute.includes("import { MODE_COPY_FIELDS } from '@/lib/workout-set-contract'") && !/const MODE_COPY_FIELDS/.test(applyRoute))
  check('B6: WorkoutExerciseBlock imports MODE_COPY_FIELDS + applyTemplateReady and its own APPLY_COPY_FIELDS list is gone', block.includes("import { MODE_COPY_FIELDS, applyTemplateReady } from '@/lib/workout-set-contract'") && !/APPLY_COPY_FIELDS/.test(block) && block.includes('const applyRequiredReady = applyTemplateReady(we.exercise.tracking_mode, applyTemplate)'))
  check('B7: the UI-5B1B enable rule is byte-identical', block.includes('const applyEnabled = !readOnly && applyRequiredReady && applyTargets.length > 0'))
  check('B8: WARMUP_FORBIDDEN_MODES is exported from the contract and excludes weight_time', WARMUP_FORBIDDEN_MODES.has('cardio') && WARMUP_FORBIDDEN_MODES.has('timed') && !WARMUP_FORBIDDEN_MODES.has('weight_time') && WARMUP_FORBIDDEN_MODES.size === 2)

  console.log('\nC. Set entry — WeightTimeSetInputs rendered (behaviour matrix)')
  const noop = () => {}
  const renderInputs = (props: Partial<Parameters<typeof WeightTimeSetInputs>[0]>) => renderToStaticMarkup(React.createElement(WeightTimeSetInputs, {
    lbs: '20', durationMin: '1', durationSec: '30', rpe: '7', isUnilateral: false, readOnly: false, inputClassName: 'input-cls',
    onLbsChange: noop, onLbsBlur: noop, onDurationMinChange: noop, onDurationSecChange: noop, onDurationBlur: noop, onRpeChange: noop, onRpeBlur: noop,
    ...props,
  }))
  const normal = renderInputs({})
  check('C1: NORMAL — exactly four inputs with the accessible names "Added weight", "Duration — minutes", "Duration — seconds", "RPE"',
    JSON.stringify(ariaLabelsOf(normal)) === JSON.stringify(['Added weight', 'Duration — minutes', 'Duration — seconds', 'RPE']), JSON.stringify(ariaLabelsOf(normal)))
  check('C2: NORMAL — NO reps input and NO distance input; the field is "Added weight", never "Weight"/"Bodyweight"', !/aria-label="Reps"|aria-label="Distance/.test(normal) && !/aria-label="Weight/.test(normal) && !/Bodyweight/.test(normal))
  check('C3: NORMAL — the values render (20, 1, 30, 7) and the suffix reads "lbs"', /value="20"/.test(inputsOf(normal)[0]) && /value="1"/.test(inputsOf(normal)[1]) && /value="30"/.test(inputsOf(normal)[2]) && /value="7"/.test(inputsOf(normal)[3]) && />lbs</.test(normal))
  const zero = renderInputs({ lbs: '0' })
  check('C4: ZERO ADDED WEIGHT — a stored 0 renders as a VISIBLE value="0" (never blank, never the placeholder alone)', /value="0"/.test(inputsOf(zero)[0]))
  const unilateral = renderInputs({ isUnilateral: true })
  check('C5: UNILATERAL — the name reads "Added weight per side" and the suffix "per side" (existing semantics preserved)', ariaLabelsOf(unilateral)[0] === 'Added weight per side' && />per side</.test(unilateral))
  const readOnly = renderInputs({ readOnly: true })
  // React renders a boolean `readOnly` as ` readonly=""`; `aria-readonly` is a different attribute and is matched separately.
  check('C6: READ-ONLY (completed workout) — every input is readonly with aria-readonly="true"', inputsOf(readOnly).length === 4 && inputsOf(readOnly).every((tag) => / readonly=""/.test(tag) && /aria-readonly="true"/.test(tag)))
  check('C7: EDITABLE — no readonly attribute on any input (aria-readonly="false")', inputsOf(normal).every((tag) => !/ readonly=""/.test(tag) && /aria-readonly="false"/.test(tag)))
  check('C8: MOBILE/NARROW — the group uses the same flex composition as the cardio/timed row (flex-1 min-w-0 groups, w-12 RPE), and the pass-through input class is applied to every input', countOf(normal, /class="flex-1 min-w-0/g) === 2 && /class="w-12 flex-shrink-0"/.test(normal) && inputsOf(normal).every((tag) => tag.includes('input-cls')))
  check('C9: the duration pair is the established minutes : seconds control (min 0, seconds max 59)', /placeholder="min"/.test(normal) && /placeholder="sec"[^>]*max="59"/.test(normal))
  check('C10: no emoji iconography in the new components', !EMOJI.test(read('src/components/workout/WeightTimeSetInputs.tsx')) && !EMOJI.test(read('src/components/progress/WeightTimeSections.tsx')))

  console.log('\nD. SetRow — warm-up, completion feedback, PR label, legacy markup')
  const setRow = read('src/components/workout/SetRow.tsx')
  const setRowCode = stripComments(setRow)
  check('D1: the warm-up toggle follows the shared contract (shown for every mode the database does not forbid — weight_time included, cardio/timed excluded)', setRowCode.includes('const showWarmupToggle = !WARMUP_FORBIDDEN_MODES.has(trackingMode)') && setRowCode.includes('aria-label="Warm-up set"'))
  check('D2: weight_time renders WeightTimeSetInputs and nothing from the strength or cardio/timed groups', setRowCode.includes("const showWeightTimeInputs = trackingMode === 'weight_time'") && /\{showWeightTimeInputs && \(\s*<WeightTimeSetInputs/.test(setRowCode) && /\{showStrengthInputs && \(/.test(setRowCode) && /\{showDurationDistanceInputs && \(/.test(setRowCode))
  const returnBody = setRowCode.slice(setRowCode.indexOf('return ('))
  check('D3: no tracking-mode literal remains inside SetRow\'s JSX — every mode decision is a named predicate above the return', !/trackingMode === '/.test(returnBody))
  check('D4: completion is refused locally with the contract\'s own message (completionError) before any request, and the reason is rendered visibly with role="alert"',
    setRowCode.includes("return completionError('weight_time', { reps: null, weightKg, durationSeconds, isWarmup })")
    && /if \(next && showWeightTimeInputs\) \{\s*const blocker = weightTimeCompletionBlocker\(\)\s*if \(blocker\) \{ setCompletionMessage\(blocker\); return \}/.test(setRowCode)
    && /role="alert"[^>]*>\s*\{completionMessage\}/.test(setRowCode))
  check('D5: a refused completion from the route surfaces its error text too (not the icon alone), while the UI-5B1A "Not saved" marker is kept', setRowCode.includes("setSaveError('Not saved')") && /if \('completed' in update\) \{[\s\S]{0,200}setCompletionMessage\(body\.error\)/.test(setRowCode))
  check('D6: the completion pre-check treats an empty weight as missing and 0 as a real value (parseFloat → lbsToKg, never a truthiness test)', setRowCode.includes("const weightInput = lbs.trim() === '' ? null : parseFloat(lbs)") && setRowCode.includes('const weightKg = weightInput === null || isNaN(weightInput) ? null : lbsToKg(weightInput)'))
  check('D7: the contract messages the user will read', ADDED_WEIGHT_REQUIRED_ERROR === 'Added weight is required to complete this set (0 is allowed).' && DURATION_REQUIRED_ERROR === 'Duration is required to complete this set.')
  check('D8: PR_LABELS adds weight_time: "Weight-time PR" and keeps the three strength labels', setRowCode.includes("weight_time: 'Weight-time PR'") && setRowCode.includes("weight: 'Weight PR'") && setRowCode.includes("estimated_1rm: 'Est. 1RM PR'") && setRowCode.includes("bodyweight_reps: 'Rep PR'"))
  check('D9: the 44px action targets are unchanged (warm-up h-11 min-w-11, complete w-11 h-11, delete h-11 w-11)', setRowCode.includes("'flex h-11 min-w-11 items-center justify-center rounded border") && setRowCode.includes("'w-11 h-11 rounded-full border-2") && setRowCode.includes('flex h-11 w-11 items-center justify-center text-ink-muted hover:text-critical'))
  check('D10: legacy inputs keep their accessible names', ['aria-label="Reps"', 'aria-label="Duration — minutes"', 'aria-label="Duration — seconds"', 'aria-label="Distance in miles"', 'aria-label="RPE — Rate of Perceived Exertion, 1 to 10"'].every((label) => setRowCode.includes(label)))
  check('D11: each of the seven hoisted legacy predicates carries its own census marker line directly above it (the warm-up toggle needs none — it reads the contract set)', countOf(setRow, /^\s*\/\/ tracking-mode-census: exempt/gm) === 7)

  console.log('\nE. WorkoutExerciseBlock — routing, badges, add-set, headers')
  const blockCode = stripComments(block)
  check('E1: weight_time routes to pickRepresentativeWeightTimeSet and the tracking-aware (2-D) signal; strength modes keep bestSet/progressSignal',
    blockCode.includes("const isWeightTime = we.exercise.tracking_mode === 'weight_time'") && /const curBest = isWeightTime\s*\? pickRepresentativeWeightTimeSet\(sets\)/.test(blockCode) && blockCode.includes('const signal  = isWeightTime || isCardioOrTimed') && blockCode.includes('trackingAwareProgressSignal(curBest, previousBest, we.exercise.tracking_mode)'))
  check('E2: Weight-time PR badges come from evaluateWeightTimeSetPRs over the prior 2-D points; evaluateSetPRs runs only for the other modes',
    /if \(isWeightTime\) \{\s*const weightTimePRs = evaluateWeightTimeSetPRs\(/.test(blockCode) && /\} else \{\s*Object\.assign\(setPRs, evaluateSetPRs\(sets, prBaseline \?\? EMPTY_PR_BASELINE\)\)/.test(blockCode) && blockCode.includes("setPRs[setId] = weightTimePRs[setId] ? 'weight_time' : null"))
  const addSet = blockCode.slice(blockCode.indexOf('async function handleAddSet'), blockCode.indexOf('async function handleRemove'))
  const weightTimeArm = addSet.slice(addSet.indexOf("trackingMode === 'weight_time'"), addSet.indexOf('} else {', addSet.indexOf("trackingMode === 'weight_time'")))
  check('E3: Add set for weight_time copies added weight with an explicit null check (0 copies as 0), duration and rpe; never reps, never distance; is_warmup false',
    weightTimeArm.includes('weight_lbs:       lastSet && lastSet.weight_kg !== null ? displayWeight(lastSet.weight_kg) : null')
    && weightTimeArm.includes('duration_seconds: lastSet?.duration_seconds ?? null') && weightTimeArm.includes('rpe:              lastSet?.rpe ?? null') && weightTimeArm.includes('is_warmup:        false')
    && !/reps:|distance_meters/.test(weightTimeArm))
  check('E4: the `else // timed` fallback no longer receives weight_time (the weight_time arm precedes it)', addSet.indexOf("trackingMode === 'weight_time'") < addSet.lastIndexOf('} else {'))
  check('E5: COLUMN_HEADERS.weight_time = "Added weight" | "Duration" | "RPE" (+ the sm: spacer)', /weight_time: \[\s*\{ label: 'Added weight', className: 'flex-1 text-center' \},\s*\{ label: 'Duration', className: 'flex-1 text-center' \},\s*\{ label: 'RPE', className: 'w-12 text-center' \},\s*\{ label: '', className: 'hidden w-11 sm:inline-block' \},\s*\]/.test(blockCode))
  check('E6: the legacy header rows are exactly the spans they always were',
    /weight_reps: \[\s*\{ label: 'Reps', className: 'flex-1 text-center' \},\s*\{ label: 'Weight', className: 'flex-1 text-center' \},\s*\{ label: 'RPE', className: 'w-12 text-center' \},\s*\{ label: '', className: 'hidden w-11 sm:inline-block' \},\s*\]/.test(blockCode)
    && /bodyweight: \[\s*\{ label: 'Reps', className: 'flex-1 text-center' \},\s*\{ label: 'RPE', className: 'w-12 text-center' \},\s*\{ label: '', className: 'hidden w-11 sm:inline-block' \},\s*\]/.test(blockCode)
    && /cardio: \[\s*\{ label: 'Duration', className: 'flex-1 text-center' \},\s*\{ label: 'Distance', className: 'flex-1 text-center' \},\s*\]/.test(blockCode)
    && /timed: \[\s*\{ label: 'Duration', className: 'flex-1 text-center' \},\s*\{ label: 'RPE', className: 'w-12 text-center' \},\s*\]/.test(blockCode))
  check('E7: the weight_time baseline prop flows page → WorkoutDetailClient → block, and the completion summary receives it',
    read('src/app/(app)/workouts/[id]/page.tsx').includes('fetchWeightTimePRBaselines(supabase, user.id, exerciseIds, params.id)')
    && read('src/app/(app)/workouts/[id]/page.tsx').includes('weightTimeBaseline={weightTimeBaseline}')
    && read('src/components/workout/WorkoutDetailClient.tsx').includes('summarizeWorkout(exercises, prBaseline ?? {}, weightTimeBaseline ?? {})')
    && read('src/components/workout/WorkoutDetailClient.tsx').includes('weightTimeBaseline={weightTimeBaseline?.[we.exercise_id]}'))

  console.log('\nF. Progress detail — WeightTimeSections rendered (three distinct concepts, frontier order, PR copy)')
  let counter = 0
  const perf = (weightLbs: number, durationSeconds: number, workoutDate: string, sessionId: string): WeightTimePerformance => {
    counter += 1
    return { setId: `s${counter}`, exerciseId: 'ex', sessionId, workoutDate, sessionCreatedAt: `${workoutDate}T10:00:00Z`, orderIndex: 0, setNumber: counter, weightKg: lbsToKg(weightLbs), durationSeconds, rpe: null }
  }
  const performances = [perf(20, 60, '2026-08-01', 'a'), perf(0, 120, '2026-08-01', 'a'), perf(25, 70, '2026-08-08', 'b'), perf(30, 40, '2026-08-15', 'c')]
  const summary = summarizeWeightTimePerformances(performances)
  const detail: WeightTimeExerciseDetail = {
    exerciseId: 'ex', exerciseName: 'Plate plank', isUnilateral: false, summary,
    history: [], latestQualifying: performances[3], previousSessionQualifying: performances[2],
  }
  const recentEntries = [{ workoutDate: '2026-08-15', weightKg: lbsToKg(30), reps: null, rpe: null, estimated1RmKg: null, durationSeconds: 40, distanceMeters: null }, { workoutDate: '2026-08-08', weightKg: 0, reps: null, rpe: 7, estimated1RmKg: null, durationSeconds: 120, distanceMeters: null }]
  const sections = renderToStaticMarkup(React.createElement(WeightTimeSections, { detail, recentEntries, isUnilateral: false }))
  const text = sections.replace(/<[^>]+>/g, '|')
  check('F1: LONGEST HOLD shows duration with its added weight — "Longest hold: 2:00 (0 lb added)" (the zero-weight hold is the longest)', text.includes('Longest hold: 2:00 (0 lb added)'))
  check('F2: HEAVIEST HOLD shows added weight with its duration — "Heaviest hold: 30 lb added (0:40)"', text.includes('Heaviest hold: 30 lb added (0:40)'))
  const frontierList = /data-record="frontier">([\s\S]*?)<\/ul>/.exec(sections)?.[1] ?? ''
  const frontierItems = (frontierList.match(/<li[^>]*>([^<]*)<\/li>/g) || []).map((item) => item.replace(/<[^>]+>/g, ''))
  check('F3: FRONTIER is a compact list of the CURRENT non-dominated points sorted by added weight — (0,2:00) (25,1:10) (30,0:40); the dominated (20,1:00) is absent',
    JSON.stringify(frontierItems) === JSON.stringify(['0 lb added · 2:00', '25 lb added · 1:10', '30 lb added · 0:40']), JSON.stringify(frontierItems))
  check('F4: no scalar ranking language — no "#1", "#2", "best set", "score" anywhere in the rendered sections', !/#\d|best set|score/i.test(text))
  const prList = /data-record="pr-history">([\s\S]*?)<\/ul>/.exec(sections)?.[1] ?? ''
  const prItems = (prList.match(/<li[^>]*>([^<]*)<\/li>/g) || []).map((item) => item.replace(/<[^>]+>/g, ''))
  check('F5: PR HISTORY uses the copy "Weight-time PR", most recent first, and keeps the dominated (20,1:00) as a historical PR',
    prItems.length === 4 && prItems.every((item) => item.includes('— Weight-time PR — ')) && prItems[0].startsWith('Aug 15 — Weight-time PR — 0:40 · 30 lb added') && prItems[3].startsWith('Aug 1 — Weight-time PR — 1:00 · 20 lb added'), JSON.stringify(prItems))
  check('F6: COACHING shows "Last: 0:40 · 30 lb added", the two approved strings verbatim, and a 2-D comparison ("Same" for the incomparable heavier/shorter hold)',
    text.includes('Last: 0:40 · 30 lb added') && text.includes(`${WEIGHT_TIME_HOLD_LONGER_GUIDANCE} ${WEIGHT_TIME_NEXT_WEIGHT_GUIDANCE}`) && text.includes('Vs. previous session: Same'))
  check('F7: RECENT HISTORY renders each session\'s hold through the shared formatter, zero as "0 lb added"', text.includes('Aug 15 — 0:40 · 30 lb added') && text.includes('Aug 8 — 2:00 · 0 lb added · RPE 7'))
  const unilateralSections = renderToStaticMarkup(React.createElement(WeightTimeSections, { detail: { ...detail, isUnilateral: true }, recentEntries, isUnilateral: true })).replace(/<[^>]+>/g, '|')
  check('F8: UNILATERAL — "per side" follows the added weight in records, frontier and history', unilateralSections.includes('Heaviest hold: 30 lb added per side (0:40)') && unilateralSections.includes('0 lb added per side · 2:00') && unilateralSections.includes('Aug 15 — 0:40 · 30 lb added per side'))
  const empty = renderToStaticMarkup(React.createElement(WeightTimeSections, { detail: null, recentEntries: [], isUnilateral: false })).replace(/<[^>]+>/g, '|')
  check('F9: EMPTY — no history renders honest empty states, never zeros or dashes', empty.includes('No records yet.') && empty.includes('No PRs yet.') && empty.includes('No completed sets yet.') && empty.includes('Log a completed set to start tracking targets.'))
  check('F10: the four cards keep the three concepts DISTINCT (three separate record lines/lists) and there is no trend chart for a hold', countOf(sections, /data-record="/g) === 4 && !/ExerciseTrendChart|<svg/.test(sections))

  console.log('\nG. Pages — routing and Recent PRs')
  const detailPage = read('src/app/(app)/progress/exercises/[id]/page.tsx')
  check('G1: the detail page routes weight_time to WeightTimeSections with fetchWeightTimeExerciseDetail, and never to the strength charts or the cardio/timed aggregate',
    detailPage.includes("const isWeightTime = trackingMode === 'weight_time'") && /isCardioTimed \|\| isWeightTime\s*\? Promise\.resolve\(null\)\s*: fetchExerciseProgressDetail/.test(detailPage)
    && /isWeightTime\s*\? fetchWeightTimeExerciseDetail\(supabase, user\.id, exercise\.id\)/.test(detailPage) && /\{isWeightTime \? \(\s*<WeightTimeSections/.test(detailPage)
    && detailPage.includes('fetchCardioTimedProgressDetail(supabase, user.id, exercise.id)'))
  const progressPage = read('src/app/(app)/progress/page.tsx')
  check('G2: /progress fetches fetchWeightTimeRecords and merges "Weight-time PR" events into one most-recent-first Recent PRs list capped at ten; the count tile counts that list',
    progressPage.includes('fetchWeightTimeRecords(supabase, user.id)') && progressPage.includes("typeLabel: 'Weight-time PR'") && progressPage.includes('.slice(0, 10)') && progressPage.includes('{recentPRTiles.length}') && progressPage.includes('recentPRTiles.map((tile) =>'))
  check('G3: the Weight-time PR tile value renders both dimensions with the O5 phrase and the per-side suffix', progressPage.includes("valueText: `${formatDurationSeconds(e.durationSeconds)} · ${formatAddedWeightLb(e.weightKg)}${e.isUnilateral ? ' per side' : ''}`"))
  check('G4: the strength Recent PR events keep their exact labels and value formatting', progressPage.includes("e.type === 'weight' ? 'Weight PR'") && progressPage.includes("? `${Math.round(kgToLbs(e.estimated1RmKg as number))} lbs${suffix}`"))

  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
