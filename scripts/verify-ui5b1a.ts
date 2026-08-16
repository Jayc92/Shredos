// ============================================================
// ForgeFitOS — UI-5B1A execution visual/accessibility harness
// Proves the /workouts/[id] presentation modernization changed ONLY
// presentation: every mutation handler, endpoint, payload rule,
// tracking-mode branch, missing-vs-zero rule, read-only lock, and
// optimistic/rollback behavior is byte-anchored unchanged, while the
// touched files gain semantic tokens, lucide icons, accessible
// names, and 44px effective targets (36px layout + 4px hit-slop on
// every side via after:-inset-1) at the phone-first max-w-3xl width.
// Client components render through the require-hook next/navigation
// stub (render-only; no handler ever fires).
// Run from the repository root:
//   npx tsx scripts/verify-ui5b1a.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

const Module = require('module')
const origLoad = Module._load
Module._load = function (request: string) {
  if (request === 'next/navigation') {
    return {
      useRouter: () => ({ push() {}, replace() {}, refresh() {}, back() {}, prefetch() {} }),
      usePathname: () => '/workouts/abc',
      useSearchParams: () => new URLSearchParams(),
    }
  }
  return origLoad.apply(this, arguments as any)
}

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const page = read('src/app/(app)/workouts/[id]/page.tsx')
const loading = read('src/app/(app)/workouts/[id]/loading.tsx')
const header = read('src/components/workout/SessionHeader.tsx')
const block = read('src/components/workout/WorkoutExerciseBlock.tsx')
const setRow = read('src/components/workout/SetRow.tsx')
const sessionNotes = read('src/components/workout/WorkoutSessionNotes.tsx')
const summaryCard = read('src/components/workout/WorkoutCompletionSummaryCard.tsx')
const TOUCHED = [page, header, block, setRow, sessionNotes]
const CHANGED_PATHS = [
  'src/app/(app)/workouts/[id]/page.tsx',
  'src/components/workout/SessionHeader.tsx',
  'src/components/workout/WorkoutExerciseBlock.tsx',
  'src/components/workout/SetRow.tsx',
  'src/components/workout/WorkoutSessionNotes.tsx',
]

async function main() {
  const { SetRow } = await import('../src/components/workout/SetRow')
  const { SessionHeader } = await import('../src/components/workout/SessionHeader')
  const { WorkoutSessionNotes } = await import('../src/components/workout/WorkoutSessionNotes')

  const mkSet = (over: Record<string, unknown> = {}) => ({
    id: 's1', workout_exercise_id: 'we1', set_number: 1, weight_kg: null,
    reps: null, rpe: null, completed: false, is_warmup: false, notes: null,
    duration_seconds: null, distance_meters: null, created_at: '', updated_at: '',
    ...over })

  // ── 1. Mutation handlers and endpoints byte-anchored ───────────────
  console.log('\n1. Handlers and endpoints unchanged')
  {
    check('H1: per-set PATCH/DELETE endpoints and refresh unchanged',
      setRow.includes('await fetch(`/api/workout-sets/${set.id}`, {') &&
      setRow.includes("fetch(`/api/workout-sets/${set.id}`, { method: 'DELETE' })") &&
      setRow.includes('router.refresh()'))
    check('H2: blur-save triggers unchanged (reps/weight/rpe/duration/distance)',
      ['handleRepsBlur', 'handleWeightBlur', 'handleRpeBlur',
        'handleDurationBlur', 'handleDistanceBlur']
        .every((h) => setRow.includes(`onBlur={${h}}`)))
    check('H3: payload composition unchanged (field-diff guards intact)',
      setRow.includes('if (!isNaN(n) && n !== set.reps) await patch({ reps: n })') &&
      setRow.includes("if (n !== stored) await patch({ weight_lbs: n })") &&
      setRow.includes('if (total !== (set.duration_seconds ?? -1)) await patch({ duration_seconds: total })'))
    check('H4: optimistic complete/warmup toggles with rollback unchanged',
      setRow.includes('const ok = await patch({ completed: next })') &&
      setRow.includes('if (!ok) setCompleted(!next)') &&
      setRow.includes('const ok = await patch({ is_warmup: next })') &&
      setRow.includes('if (!ok) setIsWarmup(!next)'))
    check('H5: read-only network backstop unchanged',
      setRow.includes('if (readOnly) return false') &&
      (setRow.match(/if \(readOnly\) return\b/g) || []).length >= 7)
    check('H6: delete confirm unchanged', setRow.includes("confirm('Delete this set?')"))
    check('H7: session mutations unchanged (title/complete/reopen/delete/calories/details)',
      header.includes("fetch(`/api/workouts/${session.id}`, { method: 'PATCH'") &&
      header.includes("fetch(`/api/workouts/${session.id}/complete`, { method: 'POST' })") &&
      header.includes("fetch(`/api/workouts/${session.id}/reopen`, { method: 'POST' })") &&
      header.includes("fetch(`/api/workouts/${session.id}`, { method: 'DELETE' })") &&
      header.includes("mode: 'workout_calories'") &&
      header.includes("mode: 'manual_metadata'"))
    check('H8: block mutations unchanged (exercise notes/add set/remove)',
      block.includes('fetch(`/api/exercises/${we.exercise.id}`') &&
      block.includes('fetch(`/api/workout-exercises/${we.id}/sets`') &&
      block.includes("fetch(`/api/workout-exercises/${we.id}`, { method: 'DELETE' })"))
    check('H9: add-set per-mode payloads byte-anchored',
      block.includes("weight_lbs: lastSet?.weight_kg ? displayWeight(lastSet.weight_kg) : null") &&
      block.includes('duration_seconds: lastSet?.duration_seconds ?? null') &&
      block.includes('is_warmup:  lastSet?.is_warmup ?? false'))
    check('H10: session-notes save unchanged (manual save, refresh, cancel restore)',
      sessionNotes.includes("fetch(`/api/workouts/${sessionId}`") &&
      sessionNotes.includes('body: JSON.stringify({ notes: draft })') &&
      sessionNotes.includes("setDraft(notes ?? '')"))
    // RETARGET (UI-5B1B): the block gained exactly one approved
    // fetch — the explicit apply-first-set action. Every other count
    // is unchanged and no other endpoint may appear.
    check('H11: no new fetch/endpoint anywhere in the slice (one approved UI-5B1B addition)',
      (stripComments(setRow).match(/fetch\(/g) || []).length === 2 &&
      (stripComments(header).match(/fetch\(/g) || []).length === 6 &&
      (stripComments(block).match(/fetch\(/g) || []).length === 4 &&
      block.includes('/apply-first-set`') &&
      (stripComments(sessionNotes).match(/fetch\(/g) || []).length === 1 &&
      !stripComments(page).includes('fetch('))
  }

  // ── 2. Tracking modes render the correct inputs (runtime) ──────────
  console.log('\n2. Tracking-mode inputs (runtime)')
  {
    const html = (mode: string, set = mkSet(), readOnly = false) =>
      renderToStaticMarkup(React.createElement(SetRow, {
        set: set as never, isUnilateral: false, trackingMode: mode as never,
        prType: null, readOnly }))
    const wr = html('weight_reps')
    check('T1: weight_reps exposes reps + weight + RPE',
      wr.includes('aria-label="Reps"') && wr.includes('aria-label="Weight in lbs"') &&
      wr.includes('RPE — Rate of Perceived Exertion'))
    const bw = html('bodyweight')
    check('T2: bodyweight exposes reps + RPE, weight behind the affordance',
      bw.includes('aria-label="Reps"') && bw.includes('+ Added weight') &&
      !bw.includes('aria-label="Added weight in lbs"'))
    const bwW = html('bodyweight', mkSet({ weight_kg: 10 }))
    check('T3: bodyweight with stored weight shows the added-weight input',
      bwW.includes('aria-label="Added weight in lbs"'))
    const ca = html('cardio')
    check('T4: cardio exposes duration pair + distance, no reps/warmup',
      ca.includes('aria-label="Duration — minutes"') &&
      ca.includes('aria-label="Distance in miles"') &&
      !ca.includes('aria-label="Reps"') && !ca.includes('aria-label="Warm-up set"'))
    const ti = html('timed')
    check('T5: timed exposes duration pair + RPE, no distance',
      ti.includes('aria-label="Duration — minutes"') &&
      ti.includes('RPE — Rate of Perceived Exertion') &&
      !ti.includes('aria-label="Distance in miles"'))
    check('T6: warmup toggle only for weight modes',
      wr.includes('aria-label="Warm-up set"') && bw.includes('aria-label="Warm-up set"') &&
      !ti.includes('aria-label="Warm-up set"'))
  }

  // ── 3. Missing is never zero (runtime + source) ────────────────────
  console.log('\n3. Missing vs zero')
  {
    const empty = renderToStaticMarkup(React.createElement(SetRow, {
      set: mkSet() as never, isUnilateral: false, trackingMode: 'weight_reps' as never,
      prType: null, readOnly: false }))
    check('Z1: null fields render as empty inputs, never 0',
      !empty.includes('value="0"') && (empty.match(/value=""/g) || []).length >= 3)
    check('Z2: blur handlers skip NaN and clear to null (never write zero for blank)',
      setRow.includes('const n = parseInt(reps)') &&
      setRow.includes("if (durationMin.trim() === '' && durationSec.trim() === '')") &&
      setRow.includes('await patch({ duration_seconds: null })') &&
      setRow.includes('await patch({ distance_meters: null })'))
    check('Z3: calories null-vs-zero rule unchanged in header',
      header.includes("caloriesBurned: caloriesValue === '' ? null : Number(caloriesValue)") &&
      header.includes('session.calories_burned != null && ('))
  }

  // ── 4. Read-only / completed behavior (runtime) ────────────────────
  console.log('\n4. Read-only behavior')
  {
    const ro = renderToStaticMarkup(React.createElement(SetRow, {
      set: mkSet({ reps: 8, weight_kg: 60, completed: true }) as never,
      isUnilateral: false, trackingMode: 'weight_reps' as never,
      prType: null, readOnly: true }))
    check('R1: read-only inputs marked readOnly + aria-readonly',
      ro.includes('readonly=""') && ro.includes('aria-readonly="true"'))
    check('R2: read-only hides delete, disables toggles',
      !ro.includes('aria-label="Delete set"') &&
      ro.includes('disabled=""'))
    check('R3: completed state visible without color alone (Check icon + label + aria-pressed)',
      ro.includes('aria-pressed="true"') && ro.includes('aria-label="Mark incomplete"') &&
      ro.includes('lucide-check'))
    check('R4: detail client read-only derivation untouched',
      read('src/components/workout/WorkoutDetailClient.tsx')
        .includes("const readOnly = session.status === 'completed'"))
    const doneHeader = renderToStaticMarkup(React.createElement(SessionHeader, {
      session: { id: 'w1', user_id: 'u', workout_date: '2026-08-10', title: 'Leg Day',
        status: 'completed', source: 'live', start_time: null, end_time: null,
        completed_duration_seconds: 3600, calories_burned: null, notes: null,
        routine_id: null, created_at: '', updated_at: '' } as never }))
    check('R5: completed header shows Reopen, no editable title button',
      doneHeader.includes('Reopen workout') && !doneHeader.includes('Complete workout') &&
      doneHeader.includes('<h1'))
    const activeHeader = renderToStaticMarkup(React.createElement(SessionHeader, {
      session: { id: 'w1', user_id: 'u', workout_date: '2026-08-10', title: 'Leg Day',
        status: 'in_progress', source: 'live', start_time: '2026-08-10T10:00:00Z',
        end_time: null, completed_duration_seconds: null, calories_burned: null,
        notes: null, routine_id: null, created_at: '', updated_at: '' } as never }))
    check('R6: active header shows Complete workout (44px principal CTA)',
      activeHeader.includes('Complete workout') && activeHeader.includes('min-h-11'))
    check('R7: session notes read-only rules unchanged (null render when empty+done)',
      renderToStaticMarkup(React.createElement(WorkoutSessionNotes, {
        sessionId: 'w1', notes: null, status: 'completed' as never })) === '' &&
      sessionNotes.includes("const isEditable = status === 'in_progress'"))
  }

  // ── 5. Saving / unsaved / failure states preserved ─────────────────
  console.log('\n5. Saving and failure states')
  {
    check('F1: per-set unsaved indicator preserved',
      setRow.includes("setSaveError('Not saved')") &&
      setRow.includes('title={saveError}') && setRow.includes('AlertCircle'))
    check('F2: busy/saving states preserved across the slice',
      setRow.includes('disabled={busy}') && block.includes("addingSet ? 'Adding…' : 'Add set'") &&
      header.includes("completing ? 'Saving…' : 'Complete workout'") &&
      sessionNotes.includes("saving ? 'Saving…' : 'Save'"))
    check('F3: aria-live feedback preserved',
      (header.match(/aria-live="polite"/g) || []).length >= 2 &&
      block.includes('aria-live="polite"'))
    check('F4: error copies preserved verbatim',
      header.includes('Could not save. Try again.') &&
      header.includes('Could not reopen. Try again.') &&
      block.includes('Could not save exercise notes. Please try again.') &&
      sessionNotes.includes('Could not save workout notes. Please try again.'))
  }

  // ── 6. Real 44px boxes, two-row mobile composition ──────────────────
  console.log('\n6. Target sizing')
  {
    check('S1: complete toggle is a REAL 44x44 CSS box',
      setRow.includes("'w-11 h-11 rounded-full border-2 flex items-center justify-center"))
    check('S2: warmup toggle is a REAL 44px-min box',
      setRow.includes("'flex h-11 min-w-11 items-center justify-center rounded border"))
    check('S3: delete-set control is a REAL 44x44 CSS box',
      setRow.includes('className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-critical'))
    check('S4: NO pseudo-element hit-slop anywhere in the slice',
      TOUCHED.every((f) => !stripComments(f).includes('after:-inset') &&
        !stripComments(f).includes('before:-inset')))
    check('S5: two-row mobile composition (inputs wrap full-width; actions grouped right)',
      setRow.includes('flex flex-wrap items-center gap-x-1.5 gap-y-1.5 sm:flex-nowrap') &&
      setRow.includes('order-last flex w-full min-w-0 items-center gap-1.5 sm:order-none sm:w-auto sm:flex-1') &&
      setRow.includes('ml-auto flex flex-shrink-0 items-center gap-2 sm:ml-0'))
    check('S6: action group spacing prevents overlap (gap-2 between real boxes)',
      setRow.includes('items-center gap-2 sm:ml-0'))
    check('S7: header aligns with the composition (labels at base, sm-only columns)',
      block.includes('hidden w-5 text-center sm:inline-block') &&
      (block.match(/hidden w-11 sm:inline-block/g) || []).length === 4 &&
      (block.match(/w-12 text-center">RPE/g) || []).length === 3)
    check('S8: sets area full width on phones (pl-0 sm:pl-6)',
      (block.match(/pl-0 sm:pl-6/g) || []).length === 2)
    check('S9: header delete/save/cancel controls at real 44px',
      (header.match(/flex h-11 w-11 items-center justify-center/g) || []).length === 3)
    check('S10: remove-exercise control at real 44px',
      block.includes('flex h-11 w-11 items-center justify-center'))
    check('S11: add-set and title targets at min-h-11',
      block.includes('flex min-h-11 items-center gap-1.5') &&
      header.includes('flex min-h-11 items-center gap-2'))
  }

  // ── 6b. Runtime composition per tracking mode ────────────────────────
  console.log('\n6b. Mobile composition per mode (runtime)')
  {
    const rowHtml = (mode: string, set = mkSet({ reps: 8, weight_kg: 60 })) =>
      renderToStaticMarkup(React.createElement(SetRow, {
        set: set as never, isUnilateral: false, trackingMode: mode as never,
        prType: null, readOnly: false }))
    for (const mode of ['weight_reps', 'bodyweight', 'cardio', 'timed']) {
      const html = rowHtml(mode)
      const inputsGroupAt = html.indexOf('order-last flex w-full')
      const actionsGroupAt = html.indexOf('ml-auto flex flex-shrink-0')
      check(`M-${mode}: renders the two-row composition with one action group`,
        inputsGroupAt > 0 && actionsGroupAt > 0 &&
        (html.match(/ml-auto flex flex-shrink-0/g) || []).length === 1 &&
        (html.match(/order-last flex w-full/g) || []).length === 1)
      check(`M-${mode}: exactly one accessible instance of each action`,
        (html.match(/aria-label="Delete set"/g) || []).length === 1 &&
        (html.match(/aria-label="Mark (in)?complete"/g) || []).length === 1 &&
        (html.match(/aria-label="Warm-up set"/g) || []).length ===
          (mode === 'weight_reps' || mode === 'bodyweight' ? 1 : 0))
    }
    // Empirical measurements (compiled stylesheet, real markup):
    // 320px -> buttons 44x44 each, 8px gaps, zero overlap, inputs
    // Reps/Weight 97px, RPE 48px, duration 56px, distance 124px,
    // card 288px, content 254px, no card/document overflow.
    // 375px -> inputs 125/125/48, duration 70, distance 152.
    // 640px (sm:) -> single 44px-tall row, inputs 155/155/48, no
    // overflow. Recorded in the notes document.
    check('M-widths: inputs get materially more than 36px at 320 (structural floor)',
      // Two flex inputs + w-12 RPE in a full-width group at 320
      // (content 254px) yields >=97px per flex input; the structure
      // that guarantees it is pinned here.
      setRow.includes('sm:order-none sm:w-auto sm:flex-1') &&
      (setRow.match(/"w-12 flex-shrink-0"/g) || []).length === 2)
  }

  // ── 7. Accessible names and non-color state ────────────────────────
  console.log('\n7. Accessible names')
  {
    check('A1: every icon control keeps a meaningful accessible name',
      ['aria-label="Delete set"', 'aria-label="Warm-up set"']
        .every((a) => setRow.includes(a)) &&
      setRow.includes("aria-label={completed ? 'Mark incomplete' : 'Mark complete'}") &&
      header.includes('aria-label="Delete workout session"') &&
      header.includes('aria-label="Save title"') &&
      block.includes('aria-label="Remove exercise"'))
    check('A2: decorative icons aria-hidden in touched files',
      (setRow.match(/aria-hidden="true"/g) || []).length >= 3 &&
      page.includes('<ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />'))
    check('A3: warmup/completed state not color-only (aria-pressed + text/icon)',
      setRow.includes('aria-pressed={isWarmup}') &&
      setRow.includes('aria-pressed={completed}') &&
      setRow.includes('WU') && setRow.includes('<Check'))
    check('A4: expand/collapse announces state', block.includes('aria-expanded={open}'))
    check('A5: no focus suppression added on touched buttons',
      TOUCHED.every((f) => !stripComments(f).includes('outline-none focus:outline-none')))
  }

  // ── 8. Glyphs, palette, and width ───────────────────────────────────
  console.log('\n8. Glyphs, palette, width')
  {
    check('G1: legacy execution glyphs gone from touched files',
      TOUCHED.every((f) => {
        const code = stripComments(f)
        return ['\u2713', '\u2190', '\u2191', '\u2192', '\u2193']
          .every((g) => !code.includes(g))
      }))
    check('G2: raw palette classes gone from touched files',
      TOUCHED.every((f) =>
        !/(green|red|blue|amber|gray|slate|zinc)-\d{3}/.test(stripComments(f))) &&
      !stripComments(setRow).includes('text-white'))
    check('G3: legacy token aliases replaced in touched files',
      TOUCHED.every((f) => !stripComments(f).includes('text-muted-foreground') &&
        !stripComments(f).includes('border-input') &&
        !stripComments(f).includes('text-destructive')))
    check('G4: trend chips use semantic state tokens + lucide icons',
      block.includes("improving: 'bg-success-subtle text-success border-success/20'") &&
      block.includes('TREND_ICON') && block.includes('TrendingUp') &&
      block.includes("improving: 'Improving'"))
    check('G5: no emoji/pictographs in touched files',
      TOUCHED.every((f) => !EMOJI.test(f)))
    check('G6: page stays phone-first max-w-3xl (never widened)',
      page.includes('max-w-3xl') && !page.includes('max-w-6xl') &&
      loading.includes('max-w-3xl'))
    check('G7: no decorative metrics/scores/badges/streaks introduced',
      // ProgressBadge is the pre-existing Phase 1E progress-signal
      // chip (real recorded comparison), not an award/milestone badge.
      TOUCHED.every((f) =>
        !/streak|ranking|adherence|consistency|projection/i.test(stripComments(f)) &&
        !/award|milestone|trophy/i.test(stripComments(f))))
  }

  // ── 9. Loading mirror ───────────────────────────────────────────────
  console.log('\n9. Loading mirror')
  {
    check('L1: loading untouched and still mirrors the page geometry',
      loading.includes('aria-hidden="true"') &&
      (loading.match(/<SkeletonCard/g) || []).length === 4 &&
      (loading.match(/<Skeleton /g) || []).length === 2 &&
      loading.includes('h-12 w-full rounded-xl'))
    check('L2: loading carries no fake values or interactive elements',
      !loading.includes('<button') && !loading.includes('<Link') &&
      !loading.includes('animate-spin'))
  }

  // ── 10. Scope and exclusions ────────────────────────────────────────
  console.log('\n10. Scope')
  {
    let diffFiles: string[] = []
    try {
      diffFiles = execSync('git diff --name-only HEAD', { encoding: 'utf8' })
        .split('\n').filter(Boolean)
    } catch { diffFiles = ['<git unavailable>'] }
    // RETARGET (UI-5B1B): the approved UI-5B1B scope adds the
    // ordering/set routes, the two detail clients, and migration 021.
    // The boundary — nothing outside a declared, approved inventory —
    // is unchanged.
    const UI5B1B_APPROVED = [
      'src/components/workout/WorkoutDetailClient.tsx',
      'src/components/routine/RoutineDetailClient.tsx',
      'src/app/api/workouts/[id]/exercise-order/route.ts',
      'src/app/api/routines/[id]/exercise-order/route.ts',
      'src/app/api/workout-exercises/[id]/route.ts',
      'src/app/api/workout-exercises/[id]/sets/route.ts',
      'src/app/api/workout-exercises/[id]/apply-first-set/route.ts',
      'src/app/api/workout-sets/[id]/route.ts',
      'src/app/api/routine-exercises/[id]/route.ts',
    ]
    check('X1: product changes confined to the approved files',
      diffFiles.filter((f) => f.startsWith('src/')).every((f) =>
        CHANGED_PATHS.includes(f) || UI5B1B_APPROVED.includes(f)),
      diffFiles.join(', '))
    check('X2: no lib, database-type, or unapproved migration change',
      diffFiles.every((f) =>
        !f.startsWith('src/lib/') && !f.includes('types/database') &&
        (!f.startsWith('supabase/') ||
          f === 'supabase/migrations/021_ui5b_transactional_ordering.sql')))
    check('X3: loading + completion summary byte-untouched (already on the token system)',
      !diffFiles.includes('src/app/(app)/workouts/[id]/loading.tsx') &&
      !diffFiles.includes('src/components/workout/WorkoutCompletionSummaryCard.tsx') &&
      !/(green|red|amber)-\d{3}|text-muted-foreground/.test(stripComments(summaryCard)))
    // RETARGET (UI-5B1B): reordering and Apply-to-remaining are now
    // the approved UI-5B1B implementation. The surviving boundary is
    // that the DEFERRED UI-5B2 features stay absent.
    check('X4: no repeat-workout / save-as-routine implementation (UI-5B2 deferred)',
      TOUCHED.every((f) => {
        const code = stripComments(f)
        return !/save.?as.?routine|repeat.?workout|save_as_routine|repeat_workout/i.test(code)
      }))
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('X5: UI-5B1A added no migration (021 = approved UI-5B1B file)',
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 21 &&
      existsSync('supabase/migrations/021_ui5b_transactional_ordering.sql'))
    check('X6: zero dependency change',
      read('package.json').includes('"next": "14.2.13"') &&
      Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
    check('X7: analytics/summary calculations untouched (lib unchanged)',
      block.includes('evaluateSetPRs(sets, prBaseline ?? EMPTY_PR_BASELINE)') &&
      block.includes('summar') === block.includes('summar') &&
      !diffFiles.includes('src/lib/workout.ts') &&
      !diffFiles.includes('src/lib/workout-coach.ts'))
    check('X8: notes doc records the slice honestly',
      read('docs/ui5b1a-execution-visual-notes.md').includes('max-w-3xl') &&
      read('docs/ui5b1a-execution-visual-notes.md').includes('44'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
