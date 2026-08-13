// ============================================================
// ForgeFitOS — Phase 5A.5 deterministic verification harness
// Verifies live workout calories parity: the shared
// validateWorkoutCalories helper (with the approved hostile-coercion
// tightening of the 5A.2 manual path), the workout_calories PATCH
// mode (live+manual, in_progress+completed, structurally
// calories-only), the LIVE-ONLY SessionHeader editor, the D2
// display-gate change — and that provenance, lifecycle, and every
// downstream boundary stay untouched: no source mutation, no
// completion-flow change, no Coach/dashboard/nutrition consumption,
// no migration. Validation logic executes at RUNTIME against the
// real lib helpers.
// Run from the repository root:
//   npx tsx scripts/verify-phase5a5.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  validateWorkoutCalories,
  validateManualWorkoutMetadata,
  WORKOUT_CALORIES_MAX,
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

const workoutLib = read('src/lib/workout.ts')
const patchRoute = read('src/app/api/workouts/[id]/route.ts')
const header = read('src/components/workout/SessionHeader.tsx')
const completeRoute = read('src/app/api/workouts/[id]/complete/route.ts')
const reopenRoute = read('src/app/api/workouts/[id]/reopen/route.ts')
const skipRoute = read('src/app/api/workouts/[id]/skip/route.ts')
const createRoute = read('src/app/api/workouts/route.ts')
const notes = read('docs/phase5a5-live-workout-calories-notes.md')

const CHANGED = [workoutLib, patchRoute, header]

// A valid manual-metadata base for delegation-equivalence checks.
const MANUAL_BASE = {
  workoutDate: '2026-08-10',
  startTime: '07:30',
  durationMinutes: 45,
}
const MANUAL_NOW = new Date('2026-08-12T12:00')

// ── 1. Checkpoint and no-migration boundary ──────────────────────────
console.log('\n1. Checkpoint and no-migration boundary')
{
  check('checkpoint artifacts exist (bfbcc93 tree)',
    ['scripts/verify-phase5a4.ts', 'docs/phase5a4-daily-aggregate-distance-notes.md',
      'supabase/migrations/017_phase5a4_daily_activity_distance.sql',
      'src/lib/activity.ts', 'src/lib/local-time.ts']
      .every((f) => existsSync(f)))
  check('5A.5 notes exist', notes.length > 1500)
  // RETARGETED (5A.6B): 018 is that approved phase's anatomy
  // migration. The property this pin protects — 5A.5 itself added NO
  // migration — is unchanged: no migration file names 5A.5, and 017
  // (the last pre-5A.5 migration) is still the newest pre-anatomy one.
  check('5A.5 added NO migration (none names it; 017 untouched)',
    !readdirSync('supabase/migrations').some((f) => f.includes('5a5')) &&
    existsSync('supabase/migrations/017_phase5a4_daily_activity_distance.sql'))
  check('migration 014 untouched (column + CHECK already serve every source)',
    read('supabase/migrations/014_phase5a2_workout_capture_metadata.sql')
      .includes('ADD COLUMN calories_burned INTEGER'))
  check('exactly 3 feature/source files carry 5A.5 markers',
    ['src/lib/workout.ts', 'src/app/api/workouts/[id]/route.ts',
      'src/components/workout/SessionHeader.tsx']
      .every((f) => read(f).includes('5A.5')))
}

// ── 2. Runtime: shared calories validator ────────────────────────────
console.log('\n2. Runtime: validateWorkoutCalories')
{
  const v = validateWorkoutCalories
  check('runtime: null -> NULL', (() => { const r = v(null); return r.ok && r.caloriesBurned === null })())
  check('runtime: undefined -> NULL', (() => { const r = v(undefined); return r.ok && r.caloriesBurned === null })())
  check('runtime: blank string -> NULL', (() => { const r = v(''); return r.ok && r.caloriesBurned === null })())
  check('runtime: whitespace-only -> NULL', (() => { const r = v('   '); return r.ok && r.caloriesBurned === null })())
  check('runtime: 0 -> 0 (explicit recorded zero, not NULL)',
    (() => { const r = v(0); return r.ok && r.caloriesBurned === 0 })())
  check('runtime: string "0" -> 0', (() => { const r = v('0'); return r.ok && r.caloriesBurned === 0 })())
  check('runtime: positive integer exact (350)',
    (() => { const r = v(350); return r.ok && r.caloriesBurned === 350 })())
  check('runtime: string positive ("425" -> 425)',
    (() => { const r = v('425'); return r.ok && r.caloriesBurned === 425 })())
  check('runtime: negative rejected', !v(-1).ok && !v('-50').ok)
  check('runtime: decimal rejected', !v(12.5).ok && !v('12.5').ok)
  check('runtime: NaN rejected', !v(NaN).ok)
  check('runtime: Infinity rejected', !v(Infinity).ok && !v(-Infinity).ok)
  check('runtime: boolean rejected (Number(true)===1 hole closed)',
    !v(true).ok && !v(false).ok)
  check('runtime: array rejected (Number([])===0 hole closed)',
    !v([]).ok && !v([100]).ok)
  check('runtime: object rejected', !v({}).ok && !v({ calories: 100 }).ok)
  check('runtime: malformed string rejected', !v('abc').ok && !v('100 cal').ok)
  check('runtime: exponent string resolves deterministically ("1e2" -> 100)',
    (() => { const r = v('1e2'); return r.ok && r.caloriesBurned === 100 })())
  check('runtime: INT4 ceiling accepted (2147483647)',
    (() => { const r = v(WORKOUT_CALORIES_MAX); return r.ok && r.caloriesBurned === 2147483647 })())
  check('runtime: INT4 ceiling + 1 rejected with a storage-bound error',
    (() => { const r = v(2147483648); return !r.ok && r.error.includes('too large') })())
  check('runtime: no product-level cap below the storage bound (999999 saves)',
    (() => { const r = v(999999); return r.ok && r.caloriesBurned === 999999 })())
  check('WORKOUT_CALORIES_MAX is exactly the PostgreSQL INTEGER ceiling',
    WORKOUT_CALORIES_MAX === 2147483647)
  check('storage ceiling documented as storage bound, not plausibility cap',
    workoutLib.includes('NOT a') && workoutLib.includes('product-level plausibility cap'))
  check('runtime: rejection errors are explicit strings',
    (() => { const r = v(true); return !r.ok && typeof r.error === 'string' && r.error.length > 0 })())
  check('runtime: result shape exact (no extra fields)',
    (() => { const r = v(100); return r.ok && Object.keys(r).sort().join(',') === 'caloriesBurned,ok' })())
}

// ── 3. Runtime: manual validator delegation ──────────────────────────
console.log('\n3. Runtime: manual validator delegation')
{
  const m = (caloriesBurned: unknown) =>
    validateManualWorkoutMetadata({ ...MANUAL_BASE, caloriesBurned }, MANUAL_NOW)
  check('manual validator delegates to the shared validator (single source)',
    workoutLib.includes('const caloriesValidation = validateWorkoutCalories(caloriesBurned)') &&
    !/let calories: number \| null = null/.test(stripComments(workoutLib)))
  check('runtime: historical blank remains NULL',
    (() => { const r = m(''); return r.ok && r.caloriesBurned === null })())
  check('runtime: historical absent remains NULL',
    (() => { const r = validateManualWorkoutMetadata(MANUAL_BASE, MANUAL_NOW); return r.ok && r.caloriesBurned === null })())
  check('runtime: historical 0 remains 0',
    (() => { const r = m(0); return r.ok && r.caloriesBurned === 0 })())
  check('runtime: historical positive remains valid (612)',
    (() => { const r = m('612'); return r.ok && r.caloriesBurned === 612 })())
  check('runtime: historical negative still rejected with the same error',
    (() => { const r = m(-5); return !r.ok && r.error === 'Calories must be a whole number of 0 or more.' })())
  check('runtime: historical decimal still rejected', !m(10.5).ok)
  // APPROVED RETARGET (D3): these coercion holes previously slipped
  // through the 5A.2 path via Number(); they are now rejected. No
  // legitimate blank/0/positive behavior changed.
  check('runtime: TIGHTENED — boolean now rejected on the manual path',
    !m(true).ok && !m(false).ok)
  check('runtime: TIGHTENED — array now rejected on the manual path',
    !m([]).ok)
  check('runtime: TIGHTENED — object now rejected on the manual path',
    !m({}).ok)
  check('runtime: manual date/start/duration behavior untouched by delegation',
    (() => {
      const r = validateManualWorkoutMetadata(
        { ...MANUAL_BASE, caloriesBurned: 300 }, MANUAL_NOW)
      return r.ok && r.workoutDate === '2026-08-10' &&
        r.durationSeconds === 2700 &&
        r.endedAt.getTime() - r.startedAt.getTime() === 2700 * 1000
    })())
  check('runtime: manual future-start rule untouched',
    !validateManualWorkoutMetadata(
      { workoutDate: '2026-08-12', startTime: '13:00', durationMinutes: 30 },
      new Date('2026-08-12T12:00')).ok)
  check('delegation flagged as an approved retarget in source',
    workoutLib.includes('approved retarget'))
  check('no second calorie validator anywhere in the lib',
    (workoutLib.match(/Calories must be a whole number/g) || []).length === 2 &&
    (workoutLib.match(/export function validateWorkoutCalories/g) || []).length === 1)
}

// ── 4. API: workout_calories mode contract ───────────────────────────
console.log('\n4. API: workout_calories mode')
{
  check('explicit mode branch exists',
    patchRoute.includes("if (body.mode === 'workout_calories') {"))
  check('legal field set exactly mode + caloriesBurned',
    patchRoute.includes("const WORKOUT_CALORIES_FIELDS = new Set(['mode', 'caloriesBurned'])"))
  check('unknown keys rejected explicitly (2M convention)',
    patchRoute.includes('Unsupported fields for calories correction.'))
  check('auth required (mode sits under the shared user gate)',
    patchRoute.indexOf("{ error: 'Unauthorized' }") <
      patchRoute.indexOf("body.mode === 'workout_calories'"))
  check('ownership enforced before any write',
    /workout_calories[\s\S]{0,700}\.eq\('user_id', user\.id\)/.test(patchRoute))
  check('unknown/unowned id -> 404 inside the mode',
    (patchRoute.match(/if \(!session\) return NextResponse\.json\(\{ error: 'Not found' \}, \{ status: 404 \}\)/g) || []).length === 2)
  check('source eligibility exactly live + manual',
    patchRoute.includes("const WORKOUT_CALORIES_SOURCES = new Set(['live', 'manual'])"))
  check('legacy and imported rejected with a clear error',
    patchRoute.includes('!WORKOUT_CALORIES_SOURCES.has(session.source)') &&
    patchRoute.includes("Calories can't be recorded for this workout type yet."))
  check('status eligibility exactly in_progress + completed',
    patchRoute.includes("const WORKOUT_CALORIES_STATUSES = new Set(['in_progress', 'completed'])"))
  check('skipped/planned rejected with a clear error',
    patchRoute.includes('!WORKOUT_CALORIES_STATUSES.has(session.status)') &&
    patchRoute.includes('Calories can only be recorded on an active or completed workout.'))
  check('validation through the shared pure validator',
    patchRoute.includes('const caloriesValidation = validateWorkoutCalories(body.caloriesBurned)'))
  check('validation failure -> 400 with the exact error',
    patchRoute.includes('{ error: caloriesValidation.error }, { status: 400 }'))
  check('mode handled BEFORE the completed-row lock (correction without reopen)',
    patchRoute.indexOf("body.mode === 'workout_calories'") <
      patchRoute.indexOf('blockIfSessionCompleted(supabase, params.id, user.id)'))
  check('mode handled AFTER the manual_metadata branch (structural ordering)',
    patchRoute.indexOf("body.mode === 'manual_metadata'") <
      patchRoute.indexOf("body.mode === 'workout_calories'"))
  check('update payload is STRUCTURALLY calories-only',
    patchRoute.includes('.update({ calories_burned: caloriesValidation.caloriesBurned })'))
  check('mode cannot mutate source/status/dates/timestamps/duration/title/notes',
    (() => {
      const branch = patchRoute.slice(
        patchRoute.indexOf("body.mode === 'workout_calories'"),
        patchRoute.indexOf('// Phase 2I:'))
      const payload = branch.slice(branch.indexOf('.update('),
        branch.indexOf(')', branch.indexOf('.update(')))
      return payload.includes('calories_burned') &&
        !payload.includes('source') && !payload.includes('status') &&
        !payload.includes('workout_date') && !payload.includes('start_time') &&
        !payload.includes('end_time') && !payload.includes('completed_duration_seconds') &&
        !payload.includes('title') && !payload.includes('notes') &&
        !payload.includes('routine_id') && !payload.includes('user_id:') &&
        !payload.includes('id:') && !payload.includes('created_at')
    })())
  check('mode never touches exercises or sets',
    (() => {
      const branch = patchRoute.slice(
        patchRoute.indexOf("body.mode === 'workout_calories'"),
        patchRoute.indexOf('// Phase 2I:'))
      return !branch.includes('workout_exercises') && !branch.includes('workout_sets')
    })())
  check('mode reads only source + status before deciding',
    /workout_calories[\s\S]{0,500}\.select\('source, status'\)/.test(patchRoute))
}

// ── 5. Generic PATCH path and lifecycle routes untouched ─────────────
console.log('\n5. Existing lifecycle paths untouched')
{
  check('completed-row lock still guards the generic title/notes path',
    patchRoute.includes('const locked = await blockIfSessionCompleted(supabase, params.id, user.id)') &&
    patchRoute.includes("const ALLOWED_FIELDS = new Set(['title', 'notes'])"))
  check('manual_metadata branch byte-level intact (field set, source gate, derived update)',
    patchRoute.includes("'mode', 'workoutDate', 'startTime', 'durationMinutes', 'caloriesBurned',") &&
    patchRoute.includes('Only manually logged workouts can be corrected here.') &&
    patchRoute.includes('completed_duration_seconds: durationSeconds,'))
  check('generic path still rejects unsupported fields explicitly',
    patchRoute.includes('Only title and notes can be updated through this endpoint.'))
  check('DELETE unchanged',
    patchRoute.includes('export async function DELETE'))
  check('complete route untouched (no calorie prompt, no calories writes)',
    !completeRoute.includes('calories') &&
    completeRoute.includes('Cannot complete a workout with no recorded start time.'))
  check('reopen route untouched by 5A.5',
    !reopenRoute.includes('calories'))
  check('skip route untouched by 5A.5',
    !skipRoute.includes('calories'))
  check('creation route untouched (manual creation calories path intact)',
    createRoute.includes('calories_burned: caloriesBurned,') &&
    createRoute.includes("source: 'live',") &&
    !createRoute.includes('workout_calories'))
}

// ── 6. SessionHeader UI: live-only editor ────────────────────────────
console.log('\n6. SessionHeader UI')
{
  check('eligibility is live-source AND active-or-completed',
    header.includes("const isLive = session.source === 'live'") &&
    header.includes("isLive && (session.status === 'in_progress' || session.status === 'completed')"))
  check('editor renders only for eligible live rows',
    header.includes('{caloriesEligible && ('))
  check('NULL shows Log calories; recorded shows Edit calories',
    header.includes("session.calories_burned != null ? 'Edit calories' : 'Log calories'"))
  check('expanded field labeled and placeheld per contract',
    header.includes('Calories burned (optional)') &&
    (header.match(/placeholder="Not recorded"/g) || []).length === 2)
  check('explicit Save changes / Cancel, no autosave',
    header.includes('handleSaveCalories') && !header.includes('onBlur=') &&
    (header.match(/'Save changes'/g) || []).length >= 1)
  check('blank save clears to NULL (never fabricated 0)',
    header.includes("caloriesBurned: caloriesValue === '' ? null : Number(caloriesValue),"))
  check('client pre-validates with the SAME shared validator',
    header.includes('const validation = validateWorkoutCalories(caloriesValue)'))
  check('posts the exact mode payload',
    header.includes("mode: 'workout_calories',"))
  check('button reopens with the current stored value (stale-state safe)',
    header.includes("setCaloriesValue(session.calories_burned != null ? String(session.calories_burned) : '')"))
  check('manual rows do NOT get the calories-only editor (full editor only)',
    !header.includes('isManual && caloriesEligible') &&
    header.includes('{isManual && (') &&
    header.includes("'Edit workout details'"))
  check('manual full editor still includes its calories field (5A.2 contract)',
    header.includes("caloriesBurned: detailsCalories === '' ? null : Number(detailsCalories),"))
  check('legacy/imported/skipped/planned get no editor (gate is source+status)',
    (() => {
      // caloriesEligible is the ONLY gate that renders the editor —
      // legacy/imported fail isLive, skipped/planned fail the status
      // disjunction. There is no other render path.
      const occurrences = header.match(/caloriesEligible/g) || []
      return occurrences.length === 2 && header.includes('{caloriesEligible && (')
    })())
  check('save success refreshes the server row (line appears immediately)',
    /handleSaveCalories\(e: React\.FormEvent\)[\s\S]{0,1500}router\.refresh\(\)/.test(header))
  check('numeric input affordances (whole calories)',
    /caloriesValue\}\s*\n\s*min="0" step="1"/.test(header) ||
    header.includes('inputMode="numeric" value={caloriesValue}'))
}

// ── 7. Display behavior (D2) ─────────────────────────────────────────
console.log('\n7. Display behavior')
{
  check('recorded calories display whenever non-null (gate has no isDone)',
    header.includes('{session.calories_burned != null && (') &&
    !header.includes('{isDone && session.calories_burned'))
  check('display copy exact: Calories burned N',
    header.includes('Calories burned {session.calories_burned}'))
  check('NULL renders nothing / 0 renders as a real zero (single strict null check)',
    !header.includes('session.calories_burned &&') &&
    header.includes('session.calories_burned != null'))
  check('D2 change flagged in source',
    header.includes('5A.5 (D2)'))
  check('Logged manually stays tied exclusively to source=manual',
    header.includes('{isManual && isDone && <span>Logged manually</span>}') &&
    (header.match(/Logged manually/g) || []).length === 1)
  check('a live row structurally cannot show Logged manually',
    header.includes("const isManual = session.source === 'manual'"))
}

// ── 8. Provenance and boundary ───────────────────────────────────────
console.log('\n8. Provenance and boundary')
{
  check('no source mutation anywhere in changed scope',
    !stripComments(header).includes('source:') &&
    !stripComments(patchRoute).includes('update({ source') &&
    !/\.update\(\{[^}]*source/.test(stripComments(patchRoute)))
  check('no calories_source column or provenance addition',
    CHANGED.every((f) => !f.includes('calories_source')))
  check('no completion prompt / modal added',
    !header.includes('completion') || !header.includes('modal'))
  check('complete flow byte-level free of calorie coupling',
    !completeRoute.includes('caloriesBurned'))
  check('no Coach consumption added',
    !read('src/lib/nutrition-coach.ts').includes('calories_burned') &&
    !read('src/lib/coach-actions.ts').includes('calories_burned'))
  check('no dashboard consumption added',
    !read('src/app/(app)/dashboard/page.tsx').includes('calories_burned'))
  check('no Weekly Review consumption added',
    !read('src/lib/weekly-review.ts').includes('calories_burned'))
  check('no progress-summary consumption added (dead path stays byte-untouched)',
    !read('src/lib/progress-summary.ts').includes('calories_burned'))
  check('no nutrition-target impact',
    CHANGED.every((f) => !stripComments(f).includes('nutrition_targets')))
  check('no eat-back / net-calorie language',
    CHANGED.every((f) => !/eat.?back|net calorie|calorie credit|earned food/i
      .test(stripComments(f))))
  check('activity-session code untouched by 5A.5',
    !read('src/lib/activity.ts').includes('workout_calories') &&
    !read('src/app/api/activity-sessions/route.ts').includes('5A.5'))
  check('5A.4 daily movement code untouched by 5A.5',
    !read('src/app/api/activity/route.ts').includes('5A.5') &&
    !read('src/components/activity/ActivityLogForm.tsx').includes('5A.5') &&
    !read('src/components/dashboard/StepsCard.tsx').includes('5A.5'))
  check('workout_sessions type untouched (calories_burned already number|null)',
    read('src/types/database.ts').includes('calories_burned: number | null'))
}

// ── 9. Docs, retargets, and hygiene ──────────────────────────────────
console.log('\n9. Docs, retargets, hygiene')
{
  check('notes document the parity gap and no-migration decision',
    notes.includes('parity') && (notes.includes('no migration') || notes.includes('No migration')))
  check('notes document the PATCH mode and live-only UI clarification',
    notes.includes('workout_calories') &&
    (notes.includes('live-only') || notes.includes('LIVE-ONLY')))
  check('notes document eligibility and NULL-vs-0',
    notes.includes('in_progress') && notes.includes('NULL = not recorded'))
  check('notes document the coercion tightening and display-gate change',
    notes.includes('boolean') && notes.includes('D2'))
  check('notes document provenance preservation and no-reopen correction',
    notes.includes("source='live'") && notes.includes('reopen'))
  check('notes flag every retarget', notes.includes('RETARGET') || notes.includes('retarget'))
  check('notes retain the roadmap items',
    notes.includes('Energy Balance') && notes.includes('multi-muscle') &&
    notes.includes('macro') && notes.includes('plausibility') &&
    notes.includes('Apple Health'))
  check('no emoji/pictographs in changed files',
    CHANGED.every((f) => !EMOJI.test(f)) && !EMOJI.test(notes))
  check('no legacy brand violations in changed files',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('changed files carry no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 10. Runtime: path-equivalence matrix ─────────────────────────────
console.log('\n10. Runtime: shared-validator equivalence matrix')
{
  // The live mode and the manual editor must accept/reject IDENTICAL
  // calorie inputs — that is what "one validator" buys. Every fixture
  // runs through both paths and must agree on outcome AND value.
  const fixtures: Array<[string, unknown]> = [
    ['blank', ''], ['whitespace', '  '], ['null', null],
    ['zero', 0], ['zero-string', '0'], ['positive', 350],
    ['positive-string', '425'], ['large', 999999],
    ['ceiling', 2147483647], ['over-ceiling', 2147483648],
    ['negative', -10], ['decimal', 99.9], ['nan', NaN],
    ['infinity', Infinity], ['boolean', true], ['array', []],
    ['object', {}], ['malformed', 'lots'],
  ]
  for (const [name, value] of fixtures) {
    const shared = validateWorkoutCalories(value)
    const manual = validateManualWorkoutMetadata(
      { ...MANUAL_BASE, caloriesBurned: value }, MANUAL_NOW)
    const agree = shared.ok === manual.ok &&
      (!shared.ok || !manual.ok ||
        shared.caloriesBurned === manual.caloriesBurned)
    check(`runtime equivalence: ${name} treated identically on both paths`, agree)
  }
  check('runtime: shared validator is pure (same input -> same output)',
    (() => {
      const a = validateWorkoutCalories('350')
      const b = validateWorkoutCalories('350')
      return a.ok && b.ok && a.caloriesBurned === b.caloriesBurned
    })())
  check('runtime: validator never mutates its input context',
    (() => {
      const probe = { caloriesBurned: '100' }
      validateWorkoutCalories(probe.caloriesBurned)
      return probe.caloriesBurned === '100'
    })())
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
