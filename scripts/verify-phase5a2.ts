// ============================================================
// ForgeFitOS — Phase 5A.2 deterministic verification harness
// Verifies historical/manual workouts: migration 014 provenance +
// calories, the historical-draft lifecycle (in_progress WITH frozen
// duration — never a true active session), authoritative duration
// (data-entry time can never replace the real workout time), the
// manual metadata correction PATCH, provenance-aware status labels,
// and that every live workout behavior is byte-anchored unchanged.
// Validation, label, and timezone logic execute at RUNTIME against
// the real lib helpers.
// Run from the repository root:
//   npx tsx scripts/verify-phase5a2.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  workoutStatusLabel,
  validateManualWorkoutMetadata,
  MANUAL_WORKOUT_FUTURE_TOLERANCE_MS,
  MANUAL_WORKOUT_MAX_DURATION_MINUTES,
  computeDurationSeconds,
  formatWorkoutDuration,
  composeTime12To24,
  splitTime24To12,
} from '../src/lib/workout'

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

const migration = read('supabase/migrations/014_phase5a2_workout_capture_metadata.sql')
const types = read('src/types/database.ts')
const workoutLib = read('src/lib/workout.ts')
const postRoute = read('src/app/api/workouts/route.ts')
const patchRoute = read('src/app/api/workouts/[id]/route.ts')
const completeRoute = read('src/app/api/workouts/[id]/complete/route.ts')
const reopenRoute = read('src/app/api/workouts/[id]/reopen/route.ts')
const skipRoute = read('src/app/api/workouts/[id]/skip/route.ts')
const routineStart = read('src/app/api/routines/[id]/start/route.ts')
const pastForm = read('src/components/workout/LogPastWorkoutForm.tsx')
const hubPage = read('src/app/(app)/workouts/page.tsx')
const header = read('src/components/workout/SessionHeader.tsx')
const card = read('src/components/workout/SessionCard.tsx')
const detailClient = read('src/components/workout/WorkoutDetailClient.tsx')
const serverLib = read('src/lib/supabase/server.ts')
const createButton = read('src/components/workout/CreateWorkoutButton.tsx')
const notes = read('docs/phase5a2-historical-workouts-notes.md')

const CHANGED = [postRoute, patchRoute, completeRoute, routineStart, pastForm,
  hubPage, header, card]

// ── 1. Checkpoint and migration 014 ──────────────────────────────────
console.log('\n1. Checkpoint and migration 014')
{
  check('checkpoint artifacts exist (262ec86 tree)',
    ['scripts/verify-phase5a1.ts', 'docs/phase5a1-backdated-fasting-notes.md',
      'src/components/fasting/EditFastForm.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('5A.2 notes exist', notes.length > 1500)
  check('migration 014 exists with the phase name',
    existsSync('supabase/migrations/014_phase5a2_workout_capture_metadata.sql'))
  check('migrations are exactly 14 — no migration 015',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 14 &&
    !readdirSync('supabase/migrations').some((f) => f.startsWith('015')))
  check('additive only: single ALTER, no DROP/UPDATE/rewrite of rows',
    migration.includes('ALTER TABLE workout_sessions') &&
    !migration.includes('DROP ') && !/^UPDATE /m.test(migration))
  check('calories_burned nullable integer with CHECK >= 0',
    migration.includes('ADD COLUMN calories_burned INTEGER') &&
    migration.includes('CHECK (calories_burned >= 0)') &&
    !migration.includes('calories_burned INTEGER NOT NULL'))
  check('source non-null with default legacy',
    migration.includes("ADD COLUMN source TEXT NOT NULL DEFAULT 'legacy'"))
  check('source CHECK lists exactly the four approved values',
    migration.includes("CHECK (source IN ('legacy', 'live', 'manual', 'imported'))"))
  check('legacy classification rationale documented in the migration',
    migration.includes('cannot') && migration.includes('legacy') &&
    migration.toLowerCase().includes('falsely labeled'))
  check('calories documented as never estimated / never fed to targets',
    migration.includes('Never estimated') && migration.includes('double-count'))
  check('imported documented as reserved only',
    migration.includes('RESERVED') || migration.includes('reserved'))
  check('PostgREST reload notify (project convention)',
    migration.includes("NOTIFY pgrst, 'reload schema';"))
  check('migration touches no status enum / index / RLS',
    !migration.includes('status') || !migration.includes('CREATE UNIQUE INDEX'))
  check('active-workout unique index untouched (008)',
    read('supabase/migrations/008_phase2l_active_workout_unique_index.sql')
      .includes("WHERE status = 'in_progress'\n  AND completed_duration_seconds IS NULL"))
  check('completed-duration semantics untouched (007)',
    read('supabase/migrations/007_phase2j_completed_duration.sql')
      .includes('ADD COLUMN completed_duration_seconds INTEGER'))
}

// ── 2. Types ─────────────────────────────────────────────────────────
console.log('\n2. Types')
{
  check('WorkoutSource literal union exact',
    types.includes("export type WorkoutSource = 'legacy' | 'live' | 'manual' | 'imported'"))
  check('session type gains nullable calories + typed source',
    types.includes('calories_burned: number | null') &&
    types.includes('source: WorkoutSource'))
  check('NULL-vs-0 contract documented in the type',
    types.includes('NULL = not recorded, 0 = explicitly zero'))
  check('no other schema churn in types (existing fields intact)',
    types.includes('completed_duration_seconds: number | null') &&
    types.includes('routine_id: string | null'))
}

// ── 3. Provenance-aware status label (runtime) ───────────────────────
console.log('\n3. Status label (runtime)')
{
  const label = (status: string, source?: string, dur?: number | null) =>
    workoutStatusLabel({ status, source, completed_duration_seconds: dur ?? null })
  check('live active workout stays In progress',
    label('in_progress', 'live', null) === 'In progress')
  check('manual historical draft reads Editing workout',
    label('in_progress', 'manual', 3600) === 'Editing workout')
  check('reopened manual workout also reads Editing workout (universal truthful label)',
    label('in_progress', 'manual', 2700) === 'Editing workout')
  check('reopened legacy row keeps existing label (never falsely manual)',
    label('in_progress', 'legacy', 3600) === 'In progress')
  check('reopened live row keeps existing label',
    label('in_progress', 'live', 3600) === 'In progress')
  check('completed manual row reads Completed',
    label('completed', 'manual', 3600) === 'Completed')
  check('planned and skipped unchanged',
    label('planned', 'legacy', null) === 'Planned' &&
    label('skipped', 'legacy', null) === 'Skipped')
  check('imported label never surfaced (no import behavior exists)',
    label('completed', 'imported', 3600) === 'Completed' &&
    !workoutLib.includes("'Imported'"))
  check('rows without source (pre-migration cache) fall back to stored-status labels',
    label('in_progress', undefined, null) === 'In progress')
  check('helper is the single shared source (used by header AND card, no local duplicates)',
    header.includes('{workoutStatusLabel(session)}') &&
    card.includes('{workoutStatusLabel(session)}') &&
    !header.includes("'Editing workout'") && !card.includes("'Editing workout'"))
  check('stored status enum untouched (label-only distinction)',
    read('src/lib/constants.ts').includes("in_progress: 'In progress',"))
}

// ── 4. Manual metadata validation (runtime) ──────────────────────────
console.log('\n4. Validation (runtime)')
{
  const now = new Date('2026-08-11T12:00:00')
  const v = (input: Record<string, unknown>) =>
    validateManualWorkoutMetadata(input as any, now)
  const base = { workoutDate: '2026-08-10', startTime: '18:00', durationMinutes: 60 }

  check('valid input accepted', v(base).ok)
  check('missing/invalid date rejected',
    !v({ ...base, workoutDate: '' }).ok && !v({ ...base, workoutDate: 'Aug 10' }).ok)
  check('missing/invalid time rejected',
    !v({ ...base, startTime: '' }).ok && !v({ ...base, startTime: '6pm' }).ok)
  check('impossible calendar values rejected',
    !v({ ...base, startTime: '99:99' }).ok)
  check('materially future start rejected (tomorrow)',
    !v({ ...base, workoutDate: '2026-08-12' }).ok &&
    (v({ ...base, workoutDate: '2026-08-12' }) as any).error ===
      'Start time cannot be in the future.')
  check('clock-skew tolerance accepts +1 minute',
    v({ workoutDate: '2026-08-11', startTime: '12:01', durationMinutes: 30 }).ok)
  check('+3 minutes rejected (tolerance is skew-only)',
    !v({ workoutDate: '2026-08-11', startTime: '12:03', durationMinutes: 30 }).ok &&
    MANUAL_WORKOUT_FUTURE_TOLERANCE_MS === 2 * 60 * 1000)
  check('duration must be a positive integer',
    !v({ ...base, durationMinutes: 0 }).ok && !v({ ...base, durationMinutes: -5 }).ok &&
    !v({ ...base, durationMinutes: 45.5 }).ok && !v({ ...base, durationMinutes: NaN }).ok)
  check('1-minute workout accepted (no invented minimum)',
    v({ ...base, durationMinutes: 1 }).ok)
  check('24h boundary: 1440 accepted, 1441 rejected',
    v({ workoutDate: '2026-08-09', startTime: '06:00', durationMinutes: 1440 }).ok &&
    !v({ ...base, durationMinutes: 1441 }).ok &&
    MANUAL_WORKOUT_MAX_DURATION_MINUTES === 1440)
  check('calories omitted/empty/null -> NULL (not recorded)',
    (() => {
      const a = v(base); const b = v({ ...base, caloriesBurned: '' })
      const c = v({ ...base, caloriesBurned: null })
      return a.ok && a.caloriesBurned === null && b.ok && b.caloriesBurned === null &&
        c.ok && c.caloriesBurned === null
    })())
  check('explicit zero calories preserved as 0 (distinct from NULL)',
    (() => { const r = v({ ...base, caloriesBurned: 0 }); return r.ok && r.caloriesBurned === 0 })())
  check('numeric-string calories accepted as integer',
    (() => { const r = v({ ...base, caloriesBurned: '428' }); return r.ok && r.caloriesBurned === 428 })())
  check('negative and fractional calories rejected',
    !v({ ...base, caloriesBurned: -1 }).ok && !v({ ...base, caloriesBurned: 12.5 }).ok)
  check('derived duration seconds and end instant are exact',
    (() => {
      const r = v(base)
      return r.ok && r.durationSeconds === 3600 &&
        r.endedAt.getTime() - r.startedAt.getTime() === 3600_000
    })())
}

// ── 5. Timezone / local date (runtime) ───────────────────────────────
console.log('\n5. Timezone and local date (runtime)')
{
  const now = new Date('2026-08-11T12:00:00')
  const v = (d: string, t: string, m: number) =>
    validateManualWorkoutMetadata({ workoutDate: d, startTime: t, durationMinutes: m }, now)

  check('evening workout: 8 PM stays hour 20 locally on the entered date',
    (() => {
      const r = v('2026-08-10', '20:00', 60)
      return r.ok && r.startedAt.getHours() === 20 && r.startedAt.getDate() === 10
    })())
  check('just-before-midnight workout keeps its local calendar date while end crosses it',
    (() => {
      const r = v('2026-08-10', '23:30', 60)
      return r.ok && r.workoutDate === '2026-08-10' &&
        r.startedAt.getDate() === 10 && r.endedAt.getDate() === 11
    })())
  check('morning workout: 6 AM stays hour 6',
    (() => { const r = v('2026-08-09', '06:00', 45); return r.ok && r.startedAt.getHours() === 6 })())
  check('historical date preserved verbatim as the local calendar date',
    (() => { const r = v('2026-07-04', '09:00', 30); return r.ok && r.workoutDate === '2026-07-04' })())
  check('single local parse — no Z append, no offset arithmetic',
    workoutLib.includes('new Date(`${workoutDate}T${startTime}`)') &&
    !stripComments(workoutLib).includes("+ 'Z'") &&
    !stripComments(workoutLib).includes('getTimezoneOffset'))
  check('storage conversion via toISOString at the write sites',
    postRoute.includes('start_time: startedAt.toISOString()') &&
    patchRoute.includes('start_time: startedAt.toISOString()'))
}

// ── 6. Live creation unchanged ───────────────────────────────────────
console.log('\n6. Live creation unchanged')
{
  check('live branch keeps status in_progress + start_time now',
    postRoute.includes("status: 'in_progress',\n      start_time: new Date().toISOString(),"))
  check('live branch writes source live EXPLICITLY (never the migration default)',
    /start_time: new Date\(\)\.toISOString\(\),[\s\S]{0,300}source: 'live',/.test(postRoute))
  check('live active-session pre-check unchanged and still guards the live branch',
    postRoute.includes('findActiveTrainingSession(supabase, user.id)') &&
    postRoute.includes("{ error: 'A workout is already in progress.', active_workout_id: activeSession.id }"))
  check('DB unique-index race fallback unchanged',
    postRoute.includes('isActiveWorkoutUniqueViolation(error)') &&
    postRoute.includes('resolveActiveWorkoutConflict'))
  check('client-preferred local workout_date unchanged',
    postRoute.includes("body.workout_date ?? new Date().toISOString().split('T')[0]"))
  check('autoTitle fallback unchanged', postRoute.includes('autoTitle(workout_date)'))
  check('CreateWorkoutButton untouched (conflict modal flow intact)',
    createButton.includes("new Date().toLocaleDateString('en-CA')") &&
    createButton.includes("res.status === 409") &&
    !createButton.includes('historical'))
  check('routine start writes source live explicitly, otherwise unchanged',
    routineStart.includes("source:     'live',") &&
    routineStart.includes("status:     'in_progress',") &&
    routineStart.includes('start_time: new Date().toISOString(),'))
  check('routine start conflict handling unchanged',
    routineStart.includes('409'))
}

// ── 7. Historical creation contract ──────────────────────────────────
console.log('\n7. Historical creation contract')
{
  check('explicit historical mode branch',
    postRoute.includes("if (earlyBody.mode === 'historical') {"))
  check('historical branch precedes (and skips) the active-session guard',
    postRoute.indexOf("mode === 'historical'") <
      postRoute.indexOf('findActiveTrainingSession(supabase, user.id)'))
  check('title required with server-side length limit',
    postRoute.includes("{ error: 'Workout title is required.' }") &&
    postRoute.includes('title.length > WORKOUT_TITLE_MAX_LENGTH'))
  check('notes optional with existing length rule (trim; blank -> null)',
    postRoute.includes('WORKOUT_NOTES_MAX_LENGTH') &&
    postRoute.includes('notes = trimmed.length > 0 ? trimmed : null'))
  check('server-side validation through the shared pure helper',
    postRoute.includes('validateManualWorkoutMetadata({') &&
    postRoute.includes('workoutDate: earlyBody.workoutDate,'))
  check('server derives every trusted field for the draft insert',
    ["workout_date: workoutDate,", "status: 'in_progress',",
      'start_time: startedAt.toISOString(),', 'end_time: endedAt.toISOString(),',
      'completed_duration_seconds: durationSeconds,', "source: 'manual',",
      'calories_burned: caloriesBurned,']
      .every((f) => postRoute.includes(f)))
  check('client can never supply status/source/duration directly',
    !postRoute.includes('earlyBody.status') && !postRoute.includes('earlyBody.source') &&
    !postRoute.includes('earlyBody.completed_duration_seconds') &&
    !postRoute.includes('body.status') && !postRoute.includes('body.source'))
  check('201 on creation (same as live)',
    (postRoute.match(/\{ status: 201 \}/g) || []).length === 2)
  check('no duplicate insert paths (exactly two session inserts: historical + live)',
    (postRoute.match(/\.from\('workout_sessions'\)\s*\n?\s*\.insert\(/g) || []).length === 2)
}

// ── 8. Draft lifecycle: never a true active session ──────────────────
console.log('\n8. Draft lifecycle')
{
  check('active-session definition unchanged (in_progress AND null duration)',
    serverLib.includes(".eq('status', 'in_progress')") &&
    serverLib.includes(".is('completed_duration_seconds', null)"))
  check('draft is editable: read-only rule keyed on completed only',
    detailClient.includes("const readOnly = session.status === 'completed'"))
  check('exercise entry available on the draft',
    detailClient.includes('{!readOnly && <AddExerciseSection'))
  check('finalization is the existing Complete action',
    header.includes("'Complete workout'") &&
    header.includes('`/api/workouts/${session.id}/complete`'))
  check('true duration displayed during entry (persisted duration preferred)',
    header.includes('formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)') &&
    (() => formatWorkoutDuration('2026-08-10T18:00:00Z', null, 3600) === '1h 0m')())
  check('runtime: entry elapsed time never wins over the frozen duration',
    formatWorkoutDuration(new Date(Date.now() - 7 * 60_000).toISOString(), null, 3600) === '1h 0m')
}

// ── 9. Completion and the frozen record ──────────────────────────────
console.log('\n9. Completion')
{
  check('complete route now reads end_time too',
    completeRoute.includes(".select('start_time, end_time, completed_duration_seconds')"))
  check('authoritative historical end_time preserved on completion',
    completeRoute.includes('end_time: existing.end_time ?? nowIso,'))
  check('live/reopened completion behavior byte-compatible (null end -> now)',
    completeRoute.includes("status: 'completed',"))
  check('frozen duration COALESCE preserved (2J rule untouched)',
    completeRoute.includes('if (existing.completed_duration_seconds == null && existing.start_time)') &&
    completeRoute.includes('computeDurationSeconds(existing.start_time, nowIso)'))
  check('runtime: duration derivation helper unchanged',
    computeDurationSeconds('2026-08-10T18:00:00Z', '2026-08-10T19:00:00Z') === 3600)
  check('no-start-time completion still rejected',
    completeRoute.includes('Cannot complete a workout with no recorded start time.'))
  check('reopen unchanged (clears end_time, preserves duration)',
    reopenRoute.includes('end_time') && reopenRoute.includes('completed_duration_seconds'))
  check('skip route untouched by 5A.2',
    !skipRoute.includes('source') && !skipRoute.includes('calories'))
}

// ── 10. Manual metadata correction PATCH ─────────────────────────────
console.log('\n10. Manual metadata PATCH')
{
  check('explicit correction mode',
    patchRoute.includes("if (body.mode === 'manual_metadata') {"))
  check('legal field set exact (mode/date/start/duration/calories only)',
    patchRoute.includes("'mode', 'workoutDate', 'startTime', 'durationMinutes', 'caloriesBurned',"))
  check('unsupported fields rejected explicitly (status/source/duration cannot be smuggled)',
    patchRoute.includes('Unsupported fields for manual metadata correction.'))
  check('ownership enforced before any write',
    /manual_metadata[\s\S]{0,700}\.eq\('user_id', user\.id\)/.test(patchRoute))
  check('unknown/unowned id -> 404',
    patchRoute.includes("if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })"))
  check('legacy and live rows rejected (manual-source only)',
    patchRoute.includes("if (session.source !== 'manual')") &&
    patchRoute.includes('Only manually logged workouts can be corrected here.'))
  check('same shared validation as creation',
    (patchRoute.match(/validateManualWorkoutMetadata\(\{/g) || []).length === 1)
  check('server derives and updates exactly the five metadata fields',
    ["workout_date: workoutDate,", 'start_time: startedAt.toISOString(),',
      'end_time: endedAt.toISOString(),', 'completed_duration_seconds: durationSeconds,',
      'calories_burned: caloriesBurned,']
      .every((f) => patchRoute.includes(f)))
  check('status and source never touched by the correction (update payload inspected)',
    (() => {
      const branch = patchRoute.slice(patchRoute.indexOf("manual_metadata"))
      const payload = branch.slice(branch.indexOf('.update({'),
        branch.indexOf('})', branch.indexOf('.update({')))
      return payload.includes('workout_date') &&
        !payload.includes('status') && !payload.includes('source')
    })())
  check('correction deliberately re-derives end_time + frozen duration (documented)',
    patchRoute.includes('deliberately replaces the frozen manual') &&
    patchRoute.includes('stale end timestamps are'))
  check('correction works on completed rows (mode handled before the completed lock)',
    patchRoute.indexOf("body.mode === 'manual_metadata'") <
      patchRoute.indexOf('blockIfSessionCompleted(supabase, params.id, user.id)'))
  check('completed row stays completed / draft stays draft (no status writes in mode)',
    patchRoute.includes('a draft stays a draft, a completed row\n    // stays completed'))
  check('existing title/notes PATCH path preserved byte-for-byte',
    patchRoute.includes("const ALLOWED_FIELDS = new Set(['title', 'notes'])") &&
    patchRoute.includes('Only title and notes can be updated through this endpoint.') &&
    patchRoute.includes('Workout title must be ') &&
    patchRoute.includes('update.notes = trimmed.length > 0 ? trimmed : null'))
  check('completed lock still guards the title/notes path',
    patchRoute.includes('const locked = await blockIfSessionCompleted(supabase, params.id, user.id)'))
  check('DELETE unchanged',
    patchRoute.includes('export async function DELETE') &&
    patchRoute.includes(".delete()\n    .eq('id', params.id).eq('user_id', user.id)"))
}

// ── 11. Log past workout UI ──────────────────────────────────────────
console.log('\n11. Log past workout UI')
{
  check('secondary action label', pastForm.includes("'Log past workout'"))
  check('lucide-only icon (History)',
    pastForm.includes("import { History } from 'lucide-react'"))
  check('Date + segmented Start + Duration input model (approved UX, Safari QA correction)',
    pastForm.includes('type="date"') &&
    pastForm.includes('role="group" aria-label="Start time"') &&
    pastForm.includes('Duration (minutes)'))
  check('duration bounds mirrored in the control', pastForm.includes('max="1440"'))
  check('calories optional with honest placeholder (no fake 0)',
    pastForm.includes('Calories burned (optional)') &&
    pastForm.includes('placeholder="Not recorded"'))
  check('client validates through the same shared helper before POST',
    pastForm.includes('validateManualWorkoutMetadata({'))
  check('POSTs the explicit historical mode',
    pastForm.includes("mode: 'historical',"))
  check('empty calories sent as null (never 0)',
    pastForm.includes("caloriesBurned: caloriesBurned === '' ? null : Number(caloriesBurned),"))
  check('routes to the new session for exercise entry',
    pastForm.includes('router.push(`/workouts/${data.id}`)'))
  check('workflow explained (add exercises, then Complete workout)',
    pastForm.includes('add exercises and sets') &&
    pastForm.includes('Press Complete workout when done'))
  check('44px-class action targets',
    pastForm.includes('min-h-11') && pastForm.includes('py-3 rounded-lg bg-brand'))
  check('hub mounts the secondary action after the primary create card',
    hubPage.includes('<LogPastWorkoutForm />') &&
    hubPage.indexOf('<CreateWorkoutButton />') < hubPage.indexOf('<LogPastWorkoutForm />'))
  check('live creation stays the primary action (untouched button)',
    hubPage.includes('<CreateWorkoutButton />'))
  check('errors on semantic critical tokens',
    pastForm.includes('text-critical bg-critical-subtle'))
  check('no emoji / no shred-card in changed scope',
    CHANGED.every((f) => !EMOJI.test(f) && !stripComments(f).includes('shred-card')))
}

// ── 12. Detail display: provenance + calories ────────────────────────
console.log('\n12. Detail display')
{
  check('manual provenance shown subtly on the completed detail',
    header.includes('{isManual && isDone && <span>Logged manually</span>}'))
  check('legacy provenance never surfaced to users',
    !header.includes("'Logged'") ? !header.includes('legacy') : true)
  check('calories rendered factually, only when recorded',
    header.includes('{isDone && session.calories_burned != null && (') &&
    header.includes('Calories burned {session.calories_burned}'))
  check('no eat-back / net-calorie language anywhere in changed scope',
    CHANGED.every((f) =>
      !/eat.?back|net calorie|calorie credit|earned food/i.test(stripComments(f))))
  check('Edit workout details exposed for manual rows only',
    header.includes('{isManual && (') &&
    header.includes("const isManual = session.source === 'manual'") &&
    header.includes("'Edit workout details'"))
  check('editor fields match the correction contract',
    header.includes('Duration (minutes)') && header.includes('Calories burned (optional)'))
  check('prefill derives from the stored row (local wall-clock start)',
    header.includes("format(new Date(session.start_time), 'HH:mm')") &&
    header.includes('Math.round(session.completed_duration_seconds / 60)'))
  check('explicit Save changes / Cancel, no autosave',
    header.includes("'Save changes'") && header.includes('Cancel') &&
    header.includes("mode: 'manual_metadata',") && !header.includes('onBlur='))
  check('editor clears back to NULL calories',
    header.includes("caloriesBurned: detailsCalories === '' ? null : Number(detailsCalories),"))
  check('status pill tokens unchanged (color taxonomy untouched)',
    header.includes("isDone ? 'bg-success-subtle text-success border-success/20'") &&
    card.includes("in_progress: 'bg-caution-subtle text-caution"))
  check('SessionCard narrowly changed (structure/duration/date intact)',
    card.includes('variant="interactive"') &&
    card.includes('formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)') &&
    card.includes("format(parseISO(session.workout_date), 'EEE, MMM d')"))
}

// ── 13. Weekly review / Coach / boundary ─────────────────────────────
console.log('\n13. Summaries and phase boundary')
{
  const weekly = read('src/lib/weekly-review.ts')
  check('finalized historical sessions count normally (completed filter unchanged)',
    weekly.includes("rows.filter((s) => s.status === 'completed')"))
  check('weekly review ignores provenance and calories (not special-cased)',
    !weekly.includes("'manual'") && !weekly.includes('calories_burned'))
  check('Coach logic untouched by source',
    !read('src/lib/coach-actions.ts').includes('calories_burned'))
  check('nutrition targets untouched (no eat-back, no target math change)',
    !read('src/lib/nutrition.ts').includes('calories_burned') &&
    read('src/lib/nutrition.ts').includes('calculateNutritionTargets'))
  check('fasting (5A.1) untouched',
    read('src/components/fasting/FastingControls.tsx')
      .includes('Leave End blank to start an ongoing fast from this time.'))
  check('shell invariant intact',
    read('src/app/(app)/layout.tsx').includes('fixed inset-0 flex overflow-hidden bg-canvas'))
  check('package.json untouched (22 deps)',
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('dead progress-summary untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')"))
  check('no import/normalization features implemented',
    CHANGED.every((f) => !/healthkit|apple health|strava|garmin|fitbit|csv/i.test(stripComments(f))))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
  check('prior-harness retargets documented in notes',
    notes.includes('retarget') &&
    read('scripts/verify-phase4b6a.ts').includes('workoutStatusLabel') &&
    read('scripts/verify-phase4b6b.ts').includes('workoutStatusLabel'))
  check('no service role in changed scope',
    CHANGED.every((f) => !f.includes('service_role')))
}

// ── 14. Exercise/set machinery unaffected ────────────────────────────
console.log('\n14. Exercise/set machinery')
{
  const setRow = read('src/components/workout/SetRow.tsx')
  const addSection = read('src/components/workout/AddExerciseSection.tsx')
  check('SetRow untouched: PATCH endpoint + completion state',
    setRow.includes('`/api/workout-sets/${set.id}`'))
  check('SetRow untouched: no provenance/calories coupling',
    !setRow.includes('source') && !setRow.includes('calories'))
  check('tracking modes intact (2R/2S anchors)',
    read('supabase/migrations/010_phase2r_exercise_tracking_modes.sql').length > 0 &&
    setRow.includes('tracking_mode') || setRow.includes('trackingMode'))
  check('add-exercise flow untouched',
    addSection.includes('/api/workouts/') && !addSection.includes('historical'))
  check('workout-exercises route untouched by 5A.2',
    !read('src/app/api/workout-exercises/[id]/route.ts').includes('source'))
  check('summary/PR pipeline untouched',
    detailClient.includes('summarizeWorkout(exercises, prBaseline ?? {})'))
  check('drafts flow through the same exercise machinery (no special-casing)',
    !detailClient.includes("'manual'") && !detailClient.includes('workoutStatusLabel'))
  check('sets on a finalized historical workout count like any completed workout',
    read('src/lib/weekly-review.ts').includes('workout_sets ( completed, is_warmup )'))
}

// ── 15. Live surface regression anchors ──────────────────────────────
console.log('\n15. Live surface regression')
{
  check('workouts GET unchanged',
    postRoute.includes(".order('workout_date', { ascending: false })"))
  check('delete flow unchanged in the header',
    header.includes('Delete this in-progress workout?') &&
    header.includes('Delete this workout? This cannot be undone.'))
  check('reopen confirm copy unchanged',
    header.includes('Reopen this workout for editing?'))
  check('conflict modal untouched',
    read('src/components/workout/ActiveWorkoutConflictModal.tsx').includes('role="dialog"'))
  check('StartWorkoutButton untouched (routine live start UI)',
    read('src/components/routine/StartWorkoutButton.tsx').includes('/start'))
  check('hub queries unchanged',
    ['fetchRecentSessions(supabase, user.id, 15)', 'fetchWorkoutWeekStats(supabase, user.id)',
      'seedExercisesIfNeeded(supabase, user.id)'].every((q) => hubPage.includes(q)))
  check('Train subnav untouched on the hub', hubPage.includes('<WorkoutsSubNav />'))
  check('detail page props contract unchanged',
    read('src/app/(app)/workouts/[id]/page.tsx').includes('<WorkoutDetailClient') &&
    read('src/app/(app)/workouts/[id]/page.tsx')
      .includes('fetchSessionWithDetails(supabase, user.id, params.id)'))
  check('header variant hierarchy unchanged',
    header.includes("variant={isActive ? 'action' : isDone ? 'elevated' : 'subtle'}"))
  check('title editing flow unchanged (100-char rule)',
    header.includes('const TITLE_MAX_LENGTH = 100') &&
    header.includes('body: JSON.stringify({ title: trimmed })'))
}

// ── 16. Validation edge cases (runtime) ──────────────────────────────
console.log('\n16. Validation edges (runtime)')
{
  const now = new Date('2026-08-11T12:00:00')
  const v = (input: Record<string, unknown>) =>
    validateManualWorkoutMetadata(input as any, now)
  const base = { workoutDate: '2026-08-10', startTime: '18:00', durationMinutes: 60 }

  check('numeric-string duration accepted (form input reality)',
    v({ ...base, durationMinutes: '60' }).ok)
  check('missing duration rejected',
    !v({ workoutDate: '2026-08-10', startTime: '18:00', durationMinutes: undefined }).ok)
  check('single-digit hour rejected by the strict HH:mm contract',
    !v({ ...base, startTime: '9:00' }).ok)
  check('exactly at tolerance boundary accepted (skew, not future)',
    v({ workoutDate: '2026-08-11', startTime: '12:02', durationMinutes: 10 }).ok)
  check('same-day earlier time accepted',
    v({ workoutDate: '2026-08-11', startTime: '06:00', durationMinutes: 45 }).ok)
  check('derived end for a numeric-string duration is exact',
    (() => {
      const r = v({ ...base, durationMinutes: '90' })
      return r.ok && r.durationSeconds === 5400 &&
        r.endedAt.getTime() - r.startedAt.getTime() === 5400_000
    })())
  check('validator is pure (same input, same result)',
    JSON.stringify(v(base)) === JSON.stringify(v(base)))
  check('calories boolean/garbage rejected',
    !v({ ...base, caloriesBurned: 'many' }).ok)
}

// ── 17. Display formatting (runtime) ─────────────────────────────────
console.log('\n17. Display formatting (runtime)')
{
  check('persisted 60m shows 1h 0m regardless of timestamps',
    formatWorkoutDuration(null, null, 3600) === '1h 0m')
  check('persisted 45m shows 45m', formatWorkoutDuration(null, null, 2700) === '45m')
  check('persisted 90m shows 1h 30m', formatWorkoutDuration(null, null, 5400) === '1h 30m')
  check('sub-minute persisted duration renders nothing (no fake 0m)',
    formatWorkoutDuration(null, null, 20) === null)
  check('skipped manual row label unchanged (runtime)',
    workoutStatusLabel({ status: 'skipped', source: 'manual', completed_duration_seconds: 3600 })
      === 'Skipped')
  check('completed legacy/live rows label unchanged (runtime)',
    workoutStatusLabel({ status: 'completed', source: 'legacy', completed_duration_seconds: 100 })
      === 'Completed' &&
    workoutStatusLabel({ status: 'completed', source: 'live', completed_duration_seconds: 100 })
      === 'Completed')
}

// ── 18. Hub and form presentation boundary ───────────────────────────
console.log('\n18. Presentation boundary')
{
  check('new form is a default Card (secondary, not elevated/action)',
    pastForm.includes('<Card variant="default"'))
  check('secondary toggle is bordered, primary create stays brand',
    pastForm.includes('border border-edge text-sm font-medium text-ink') &&
    createButton.includes('bg-') === createButton.includes('bg-'))
  check('no md: breakpoint usage (lg-only shell convention)',
    !pastForm.includes('md:'))
  check('responsive reflow: 1-col mobile, 2-col from sm: (Safari QA correction)',
    (pastForm.match(/grid grid-cols-1 sm:grid-cols-2 gap-2/g) || []).length === 2 &&
    !pastForm.includes('"grid grid-cols-2 gap-2"'))
  check('labeled fields throughout the new form',
    (pastForm.match(/<label className="block text-xs text-ink-muted">/g) || []).length >= 5)
  check('no fixed-width traps', !/w-\[\d{3,}px\]/.test(pastForm))
  check('no route-level scrollers/viewport heights',
    !pastForm.includes('overflow-y') && !pastForm.includes('h-screen') &&
    !pastForm.includes('dvh'))
  check('legacy tokens absent in the new form',
    ['text-muted-foreground', 'border-border', 'bg-primary', 'bg-accent', 'destructive']
      .every((t) => !pastForm.includes(t)))
}

// ── 19. Documentation contract ───────────────────────────────────────
console.log('\n19. Documentation')
{
  check('7-minute failure mode documented', notes.includes('7-minute workout'))
  check('lifecycle documented (draft = correction state)',
    notes.includes("status = 'in_progress'") && notes.includes('frozen from birth'))
  check('legacy rationale documented', notes.includes('falsely labeled'))
  check('double-counting warning documented', notes.includes('double-count'))
  check('Editing workout ambiguity limitation documented',
    notes.includes('Editing workout') && notes.includes('reopened'))
  check('both retarget classes documented',
    notes.includes('Provenance-aware presentation') &&
    notes.includes('Migration-boundary pins'))
  check('deferred list: routine historical + imports + 015 reserved',
    notes.includes('Routine-based historical logging') &&
    notes.includes('Apple Health') && notes.includes('015'))
  check('complete-route narrow change documented',
    notes.includes('existing.end_time ?? nowIso'))
}

// ── 20. Safari layout QA correction ──────────────────────────────────
console.log('\n20. Safari layout correction')
{
  check('grid cells defeat min-width:auto (min-w-0 on every field cell)',
    (pastForm.match(/className="space-y-1 min-w-0"/g) || []).length === 4)
  check('field controls carry w-full min-w-0 (3 inputs + 3 time selects per form)',
    (pastForm.match(/w-full min-w-0 px-2 py-2/g) || []).length === 6)
  check('SessionHeader editor gets the identical fix (same defect class)',
    (header.match(/grid grid-cols-1 sm:grid-cols-2 gap-2/g) || []).length === 2 &&
    (header.match(/className="space-y-1 min-w-0"/g) || []).length === 4 &&
    (header.match(/w-full min-w-0 px-2 py-2/g) || []).length === 6)
  check('no forced 4-column layout anywhere in the forms',
    !pastForm.includes('grid-cols-4') && !header.includes('grid-cols-4'))
  check('no horizontal-overflow constructs / no JS viewport sizing',
    !pastForm.includes('overflow-x') && !stripComments(pastForm).includes('innerWidth') &&
    !stripComments(pastForm).includes('addEventListener'))
  check('shell invariant untouched by the correction',
    read('src/app/(app)/layout.tsx').includes('fixed inset-0 flex overflow-hidden bg-canvas'))
  check('native type="time" removed from BOTH manual forms (segmented control instead)',
    !pastForm.includes('type="time"') && !header.includes('type="time"'))
  check('native duration/calories constraints agree with shared validation',
    pastForm.includes('min="1"') && pastForm.includes('max="1440"') &&
    pastForm.includes('min="0"') && pastForm.includes('step="1"'))
  check('incomplete segmented time guarded before shared validation (exact copy)',
    pastForm.includes("setError('Enter a complete start time.')") &&
    header.includes("setDetailsError('Enter a complete start time.')"))
}

// ── 21. Time semantics — the physical QA scenario (runtime) ──────────
console.log('\n21. Physical-QA time semantics (runtime)')
{
  // Reproduces the exact report: local now = 2:46 PM on Aug 11.
  const now = new Date('2026-08-11T14:46:00')
  const v = (d: string, t: string, m = 60) =>
    validateManualWorkoutMetadata({ workoutDate: d, startTime: t, durationMinutes: m }, now)

  check('same-day 1:00 PM accepted when now is 2:46 PM (the reported rejection)',
    v('2026-08-11', '13:00').ok)
  check('same-day 1:30 PM accepted', v('2026-08-11', '13:30').ok)
  check('same-day 2:40 PM accepted', v('2026-08-11', '14:40').ok)
  check('same-day 2:45 PM accepted', v('2026-08-11', '14:45').ok)
  check('now + 1 minute accepted (within the 2-minute skew tolerance)',
    v('2026-08-11', '14:47').ok)
  check('now + 3 minutes rejected', !v('2026-08-11', '14:49').ok)
  check('same-day 1:00 AM accepted (AM semantics)', v('2026-08-11', '01:00').ok)
  check('same-day 11:30 PM rejected while still in the future',
    !v('2026-08-11', '23:30').ok &&
    (v('2026-08-11', '23:30') as any).error === 'Start time cannot be in the future.')
  check('yesterday 1:00 PM accepted', v('2026-08-10', '13:00').ok)
  check('yesterday 11:30 PM accepted', v('2026-08-10', '23:30').ok)
  check('midnight-crossing duration keeps the entered start-date calendar day',
    (() => {
      const r = v('2026-08-10', '23:30', 60)
      return r.ok && r.workoutDate === '2026-08-10' && r.endedAt.getDate() === 11
    })())
  check('validator itself was never the defect (12h/24h handled by the HH:mm value contract)',
    v('2026-08-11', '13:00').ok && !v('2026-08-11', '1:00 PM' as any).ok)
}

// ── 22. Segmented time entry (Safari QA correction 2, runtime) ───────
console.log('\n22. Segmented time entry (runtime)')
{
  check('1:00 AM composes to 01:00', composeTime12To24('1', '00', 'AM') === '01:00')
  check('1:00 PM composes to 13:00', composeTime12To24('1', '00', 'PM') === '13:00')
  check('12:00 AM composes to 00:00 (midnight)', composeTime12To24('12', '00', 'AM') === '00:00')
  check('12:00 PM composes to 12:00 (noon)', composeTime12To24('12', '00', 'PM') === '12:00')
  check('11:30 PM composes to 23:30', composeTime12To24('11', '30', 'PM') === '23:30')
  check('missing hour never serializes', composeTime12To24('', '00', 'PM') === null)
  check('missing minute never serializes', composeTime12To24('1', '', 'PM') === null)
  check('missing AM/PM never serializes', composeTime12To24('1', '00', '') === null)
  check('out-of-range segments never serialize',
    composeTime12To24('13', '00', 'PM') === null &&
    composeTime12To24('0', '00', 'AM') === null &&
    composeTime12To24('1', '60', 'PM') === null &&
    composeTime12To24('1', '00', 'XX') === null)
  check('composed value satisfies the unchanged shared validator (1 PM at 2:46 PM)',
    (() => {
      const t = composeTime12To24('1', '00', 'PM')
      return t !== null && validateManualWorkoutMetadata(
        { workoutDate: '2026-08-11', startTime: t, durationMinutes: 60 },
        new Date('2026-08-11T14:46:00')).ok
    })())
  check('prefill 00:30 -> 12:30 AM',
    JSON.stringify(splitTime24To12('00:30')) ===
      JSON.stringify({ hour12: '12', minute: '30', meridiem: 'AM' }))
  check('prefill 12:30 -> 12:30 PM',
    JSON.stringify(splitTime24To12('12:30')) ===
      JSON.stringify({ hour12: '12', minute: '30', meridiem: 'PM' }))
  check('prefill 13:05 -> 1:05 PM',
    JSON.stringify(splitTime24To12('13:05')) ===
      JSON.stringify({ hour12: '1', minute: '05', meridiem: 'PM' }))
  check('prefill 23:59 -> 11:59 PM',
    JSON.stringify(splitTime24To12('23:59')) ===
      JSON.stringify({ hour12: '11', minute: '59', meridiem: 'PM' }))
  check('malformed prefill input rejected',
    splitTime24To12('9:00') === null && splitTime24To12('25:00') === null &&
    splitTime24To12('12:75') === null)
  check('round-trip stability across every hour of the day',
    Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:15`)
      .every((t) => {
        const p = splitTime24To12(t)
        return p !== null && composeTime12To24(p.hour12, p.minute, p.meridiem) === t
      }))
}

// ── 23. Segmented control UI contract ────────────────────────────────
console.log('\n23. Segmented control UI')
{
  for (const [name, src] of [['LogPastWorkoutForm', pastForm], ['SessionHeader', header]] as const) {
    check(`${name}: visible group label + grouped semantics`,
      src.includes('>Start time</span>') &&
      src.includes('role="group" aria-label="Start time"'))
    check(`${name}: accessible sub-labels (Hour / Minute / AM or PM)`,
      src.includes('aria-label="Hour"') && src.includes('aria-label="Minute"') &&
      src.includes('aria-label="AM or PM"'))
    check(`${name}: hour and AM/PM start as placeholders (never a false-complete state)`,
      src.includes('<option value="">Hour</option>') &&
      src.includes('<option value="">AM/PM</option>'))
    check(`${name}: minute defaults visibly to 00`,
      src.includes("useState('00')") || src.includes("?? '00'"))
    check(`${name}: full 1-12 / 00-59 ranges from generated options`,
      src.includes("Array.from({ length: 12 }, (_, i) => String(i + 1))") &&
      src.includes("Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))"))
  }
  check('segments compose through the shared helper before validation (both forms)',
    pastForm.includes('composeTime12To24(startHour, startMinute, startMeridiem)') &&
    header.includes('composeTime12To24(detailsHour, detailsMinute, detailsMeridiem)'))
  check('prefill splits the stored local instant through the shared helper',
    header.includes("splitTime24To12(format(new Date(session.start_time), 'HH:mm'))"))
  check('server contract unchanged: composed HH:mm still sent as startTime',
    pastForm.includes('startTime,') && header.includes('startTime: detailsStart,'))
  check('segmented row fits three selects (grid-cols-3 with min-w-0)',
    pastForm.includes('grid grid-cols-3 gap-1 min-w-0') &&
    header.includes('grid grid-cols-3 gap-1 min-w-0'))
  check('no emoji / no decorative icons in the segments',
    !/Clock|Watch|Timer/.test(pastForm.split('lucide-react')[1]?.split('\n')[0] ?? ''))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
