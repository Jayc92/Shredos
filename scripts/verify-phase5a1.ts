// ============================================================
// ForgeFitOS — Phase 5A.1 deterministic verification harness
// Verifies backdated + manual ongoing fasting: the nullable-end
// schema contract, validation (runtime-executed against the real
// helper), the ongoing/completed manual insert contracts, the
// active-fast conflict rule, local-time handling, timer/stats/
// history derivation — and that everything outside FastingControls
// and the additive lib helper is byte-anchored unchanged.
// Run from the repository root:
//   npx tsx scripts/verify-phase5a1.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import { format } from 'date-fns'
import {
  validateManualFastTimes,
  MANUAL_FAST_FUTURE_TOLERANCE_MS,
  didCompleteGoal,
  computeFastingWeekStats,
  getFastingDuration,
} from '../src/lib/fasting'

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

const controls = read('src/components/fasting/FastingControls.tsx')
const editForm = read('src/components/fasting/EditFastForm.tsx')
const fastingLib = read('src/lib/fasting.ts')
const timer = read('src/components/fasting/FastingTimer.tsx')
const stats = read('src/components/fasting/FastingStats.tsx')
const history = read('src/components/fasting/FastingHistory.tsx')
const fastingPage = read('src/app/(app)/fasting/page.tsx')
const hooks = read('src/hooks/useFasting.ts')
const schema = read('supabase/migrations/001_phase1a_schema.sql')
const notes = read('docs/phase5a1-backdated-fasting-notes.md')

// ── 1. Checkpoint and schema invariants ──────────────────────────────
console.log('\n1. Checkpoint and schema invariants')
{
  check('checkpoint artifacts exist (49f359d tree)',
    ['scripts/verify-phase4b6d.ts', 'docs/phase4b6d-onboarding-final-cleanup-notes.md',
      'src/components/food/FuelSubNav.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('5A.1 notes exist', notes.length > 1500)
  check('5A.1 added no migration (schema through 013 intact; 014_phase5a2 belongs to 5A.2)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('started_at is NOT NULL in schema',
    schema.includes('started_at       TIMESTAMPTZ NOT NULL'))
  check('ended_at nullable = active contract in schema',
    schema.includes('ended_at         TIMESTAMPTZ,') &&
    schema.includes('NULL = fast is currently active'))
  check('no duration column stored (derived-only rule intact)',
    (() => {
      const block = schema.slice(schema.indexOf('CREATE TABLE fasting_logs'))
      const table = block.slice(0, block.indexOf(');'))
      return !/duration/i.test(table) &&
        schema.includes('duration_minutes is NOT stored') &&
        fastingLib.includes('duration_minutes is NOT stored in the database')
    })())
  check('one-active partial unique index preserved',
    schema.includes('CREATE UNIQUE INDEX fasting_logs_one_active_fast_per_user') &&
    schema.includes('WHERE ended_at IS NULL'))
  check('fasting RLS unchanged',
    schema.includes('ALTER TABLE fasting_logs ENABLE ROW LEVEL SECURITY'))
  check('no fasting API route introduced (direct RLS-scoped writes remain)',
    !existsSync('src/app/api/fasting'))
  check('no new routes/aliases',
    !existsSync('src/app/(app)/fasting/manual') && !existsSync('src/app/scroll-diag'))
  check('goal_hours CHECK 1..96 untouched',
    schema.includes('CHECK (goal_hours BETWEEN 1 AND 96)'))
  check('fasting_type CHECK untouched',
    schema.includes("CHECK (fasting_type IN ('overnight', 'intermittent', 'extended', 'custom'))"))
}

// ── 2. Live start unchanged ──────────────────────────────────────────
console.log('\n2. Live start unchanged')
{
  check('Start fast now literal retained', controls.includes("'Start fast now'"))
  check('live start inserts started_at = now',
    controls.includes('started_at: new Date().toISOString()'))
  check('live start inserts ended_at = null',
    /startFast[\s\S]{0,700}ended_at: null/.test(controls))
  check('selected goal preserved (hours or null)',
    controls.includes('const hours = parseFloat(goalHours) || null'))
  check('fasting_type derived exactly as before',
    controls.includes("fasting_type: hours ? fastingTypeFromHours(hours) : 'intermittent'"))
  check('live-start duplicate fallback preserved',
    controls.includes("setError('You already have an active fast.')"))
  check('no-goal option retained in live start',
    controls.includes('<option value="">No goal</option>'))
  check('useFasting hook start path untouched',
    hooks.includes('started_at: new Date().toISOString()') &&
    hooks.includes("throw new Error('You already have an active fast.')"))
  check('end flow unchanged (didCompleteGoal on end, single update call)',
    controls.includes('didCompleteGoal(activeFast.started_at, endedAt, activeFast.goal_hours)') &&
    (controls.match(/\.update\(/g) || []).length === 1)
  check('End fast literal retained', controls.includes("'End fast'"))
}

// ── 3. Validation helper — runtime execution ─────────────────────────
console.log('\n3. Validation (runtime)')
{
  const now = new Date('2026-08-10T22:00:00')
  const v = (s: string, e: string) => validateManualFastTimes(s, e, now)

  check('empty start rejected with exact copy',
    !v('', '').ok && (v('', '') as any).error === 'Start time is required.')
  check('malformed start rejected',
    !v('not-a-date', '').ok && (v('not-a-date', '') as any).error === 'Enter a valid start time.')
  check('materially future start rejected (tomorrow)',
    !v('2026-08-11T20:00', '').ok &&
    (v('2026-08-11T20:00', '') as any).error === 'Start time cannot be in the future.')
  check('future start rejected just past tolerance (+3 min)',
    !v('2026-08-10T22:03', '').ok)
  check('clock-skew tolerance accepts +1 min',
    v('2026-08-10T22:01', '').ok)
  check('tolerance constant is small (2 minutes) — skew only, not a grace window',
    MANUAL_FAST_FUTURE_TOLERANCE_MS === 2 * 60 * 1000)
  check('valid past start accepted (the 8:00 PM case)',
    v('2026-08-10T20:00', '').ok)
  check('historical date start accepted (no arbitrary age limit)',
    v('2026-07-01T20:00', '').ok)
  check('blank end -> ongoing (endedAt null)',
    (() => { const r = v('2026-08-10T20:00', ''); return r.ok && r.endedAt === null })())
  check('malformed end rejected',
    !v('2026-08-10T20:00', 'garbage').ok &&
    (v('2026-08-10T20:00', 'garbage') as any).error === 'Enter a valid end time.')
  check('end before start rejected with exact copy',
    !v('2026-08-10T20:00', '2026-08-10T19:00').ok &&
    (v('2026-08-10T20:00', '2026-08-10T19:00') as any).error ===
      'End time must be after the start time.')
  check('identical start/end rejected',
    !v('2026-08-10T20:00', '2026-08-10T20:00').ok)
  check('end after start accepted',
    v('2026-08-09T20:00', '2026-08-10T12:00').ok)
  check('no invented minimum duration (1-minute fast accepted)',
    v('2026-08-10T20:00', '2026-08-10T20:01').ok)
  check('entered start preserved exactly (no rounding, no shifting)',
    (() => {
      const r = v('2026-08-10T20:00', '')
      return r.ok && r.startedAt.getTime() === new Date('2026-08-10T20:00').getTime()
    })())
  check('validation is pure (same input, same result)',
    JSON.stringify(v('2026-08-10T20:00', '')) === JSON.stringify(v('2026-08-10T20:00', '')))
}

// ── 4. Timezone handling — runtime ───────────────────────────────────
console.log('\n4. Timezone handling (runtime)')
{
  const r = validateManualFastTimes('2026-08-10T20:00', '', new Date('2026-08-10T22:00:00'))
  check('local wall-clock preserved: 8 PM stays hour 20 locally',
    r.ok && r.startedAt.getHours() === 20 && r.startedAt.getMinutes() === 0)
  check('calendar date not shifted', r.ok && r.startedAt.getDate() === 10 &&
    r.startedAt.getMonth() === 7 && r.startedAt.getFullYear() === 2026)
  check('single JS Date parse — no Z suffix appended to the local string',
    !stripComments(controls).includes("+ 'Z'") && !stripComments(controls).includes('+ "Z"') &&
    !stripComments(fastingLib).includes("+ 'Z'"))
  check('no manual UTC offset arithmetic',
    !stripComments(controls).includes('getTimezoneOffset') &&
    !stripComments(fastingLib).includes('getTimezoneOffset'))
  check('storage conversion happens once via toISOString at insert',
    controls.includes('started_at: startedAt.toISOString()') &&
    controls.includes('ended_at: endedAt?.toISOString() ?? null'))
  check('helper parses the raw input exactly once',
    (fastingLib.match(/new Date\(startRaw\)/g) || []).length === 1 &&
    (fastingLib.match(/new Date\(endRaw\)/g) || []).length === 1)
}

// ── 5. Manual completed contract ─────────────────────────────────────
console.log('\n5. Manual completed contract')
{
  check('validation runs before any write',
    controls.indexOf('validateManualFastTimes(manualStart, manualEnd)') <
    controls.indexOf("supabase.from('fasting_logs').insert({\n      user_id: user.id,\n      started_at: startedAt.toISOString()"))
  check('exact end persisted for completed entries',
    controls.includes('ended_at: endedAt?.toISOString() ?? null'))
  check('completed_goal uses the authoritative existing rule',
    controls.includes('const completed = endedAt && hours ? didCompleteGoal(startedAt, endedAt, hours) : null'))
  check('goal rule itself unchanged (runtime): 16h met/unmet/no-goal',
    didCompleteGoal('2026-08-09T20:00', '2026-08-10T12:30', 16) === true &&
    didCompleteGoal('2026-08-09T20:00', '2026-08-10T11:00', 16) === false &&
    didCompleteGoal('2026-08-10T20:00', '2026-08-10T20:30', null) === true)
  check('duration still derived, never persisted (no duration field in insert)',
    !stripComments(controls).includes('duration'))
  check('manual fasting_type fallback unchanged',
    controls.includes("fasting_type: hours ? fastingTypeFromHours(hours) : 'custom'"))
  check('notes preserved as before', controls.includes('notes: manualNotes || null'))
  check('manual goal select still sourced from shared constants',
    (controls.match(/FASTING_GOAL_OPTIONS\.map/g) || []).length === 2)
  check('completed history duration derives from timestamps (runtime)',
    getFastingDuration('2026-08-10T20:00', '2026-08-10T21:30').minutes === 90)
}

// ── 6. Manual ongoing contract ───────────────────────────────────────
console.log('\n6. Manual ongoing contract')
{
  check('blank end inserts ended_at null (ongoing = active row)',
    controls.includes('ended_at: endedAt?.toISOString() ?? null'))
  check('entered start persisted exactly (no submission-time overwrite)',
    controls.includes('started_at: startedAt.toISOString()') &&
    !/addManualFast[\s\S]*started_at: new Date\(\)\.toISOString/.test(controls))
  check('completed_goal stays NULL while ongoing (matches live start)',
    controls.includes(': null') &&
    controls.includes('const completed = endedAt && hours'))
  check('ongoing entry blocked in UI when a fast is already active',
    controls.includes('if (!endedAt && activeFast) {'))
  check('conflict copy is the explicit approved sentence',
    controls.includes(
      "'You already have an active fast. End the current fast before starting another ongoing fast.'"))
  check('conflict never mutates or replaces the existing fast (guard precedes any write)',
    controls.indexOf('if (!endedAt && activeFast)') <
      controls.indexOf('started_at: startedAt.toISOString()') &&
    !controls.includes('.delete('))
  check('exactly one update call in the file (endFast) — conflict path writes nothing',
    (controls.match(/\.update\(/g) || []).length === 1)
  check('23505 race fallback maps to the same conflict copy',
    /23505[\s\S]{0,300}ACTIVE_CONFLICT_COPY/.test(controls))
  check('no second-timer path: page renders one timer from the active row',
    fastingPage.includes('{activeFast && <FastingTimer fast={activeFast} />}') &&
    (fastingPage.match(/<FastingTimer/g) || []).length === 1)
  check('normal end flow terminates a backdated active fast (same endFast update)',
    controls.includes(".update({ ended_at: endedAt, completed_goal: completed })"))
}

// ── 7. Timer and projection derive from entered start ────────────────
console.log('\n7. Timer and projection')
{
  check('timer elapsed = now - started_at (row value, not mount time)',
    timer.includes('getFastingDuration(fast.started_at, null)'))
  check('timer never anchors on submission/mount time',
    !stripComments(timer).includes('Date.now'))
  check('timer ticks every second and re-keys on started_at',
    timer.includes('setInterval(tick, 1000)') && timer.includes('[fast.started_at]'))
  check('projected end derives from entered start + goal',
    timer.includes('addHours(new Date(fast.started_at), fast.goal_hours)'))
  check('goal progress uses existing goal math',
    timer.includes('(mins / (fast.goal_hours * 60)) * 100'))
  check('goal-reached indicator unchanged', timer.includes('Reached!'))
  check('runtime: elapsed derivation from a backdated start is timestamp math',
    (() => {
      const { minutes } = getFastingDuration(
        new Date(Date.now() - 125 * 60_000), null)
      return minutes === 125
    })())
  check('FastingTimer untouched by 5A.1 (no manual-entry coupling)',
    !timer.includes('manual') && !timer.includes('validateManualFastTimes'))
}

// ── 8. History and weekly stats ──────────────────────────────────────
console.log('\n8. History and weekly stats')
{
  check('history query excludes ongoing fasts (completed only)',
    fastingPage.includes(".not('ended_at', 'is', null)"))
  check('week stats reducer filters to completed rows',
    fastingLib.includes('const completed = fasts.filter((f) => f.ended_at !== null)'))
  check('runtime: active fast excluded from averages but counted in total',
    (() => {
      const rows = [
        { started_at: '2026-08-10T20:00', ended_at: null, completed_goal: null },
        { started_at: '2026-08-09T20:00', ended_at: '2026-08-09T21:00', completed_goal: true },
      ] as any
      const s = computeFastingWeekStats(rows)
      return s.totalCount === 2 && s.avgDurationMinutes === 60 && s.completedCount === 1
    })())
  check('runtime: no completed rows -> null averages, honest zero',
    (() => {
      const s = computeFastingWeekStats([
        { started_at: '2026-08-10T20:00', ended_at: null, completed_goal: null },
      ] as any)
      return s.completedCount === 0 && s.avgDurationMinutes === null && s.totalCount === 1
    })())
  check('history component untouched (renders stored rows)',
    history.includes('fasts') && !history.includes('validateManualFastTimes'))
  check('stats component untouched',
    stats.includes('variant="metric"') && !stats.includes('manual'))
  // RETARGET (LOCAL-DATE-FIX): original boundary — the fasting week
  // anchored at `startOfISOWeek(new Date())`, the SERVER'S UTC clock,
  // so "this week" flipped a day early every Sunday evening ET. The
  // same date-fns ISO-week helper now anchors to the cookie-resolved
  // user-local day; the Monday-boundary semantics and the gte-only
  // query shape are unchanged.
  check('weekly fetch boundary unchanged (ISO week helper)',
    read('src/lib/supabase/server.ts')
      .includes('const weekStart = startOfISOWeek(parseISO(localTodayFromCookies()))'))
  check('weekly review fasting inputs unchanged',
    read('src/lib/weekly-review.ts').includes('fasting'))
}

// ── 9. UI contract ───────────────────────────────────────────────────
console.log('\n9. UI contract')
{
  check('End starts blank (state initialised empty, never prefilled)',
    controls.includes("const [manualEnd, setManualEnd] = useState('')") &&
    !controls.includes('setManualEnd(new Date'))
  check('End field labeled optional', controls.includes('>End (optional)</label>'))
  check('helper copy explains blank = ongoing (exact sentence)',
    controls.includes('Leave End blank to start an ongoing fast from this time.'))
  // RETARGET (UI-6B): original boundary — the toggle's literal was
  // "'+ Add a fast manually'". The ASCII plus became a Lucide Plus
  // icon on a 44px control; the label text and its placement outside
  // the active ternary are unchanged.
  check('manual entry reachable while a fast is active (toggle outside the active ternary)',
    !controls.includes('{!activeFast && (') &&
    controls.indexOf("'Add a fast manually'") > controls.indexOf('End fast'))
  check('manual heading retained', controls.includes('Manual fast entry'))
  check('save action label', controls.includes("'Save manual fast'"))
  check('errors use semantic critical tokens',
    controls.includes('text-critical bg-critical-subtle'))
  check('broken legacy destructive tokens removed',
    !controls.includes('destructive'))
  check('broken legacy border/accent interaction tokens removed',
    !controls.includes('border-border') && !controls.includes('bg-accent') &&
    !controls.includes('bg-primary'))
  // RETARGET (UI-6B): original boundary — the app-wide input chrome
  // of its era (bg-secondary + border-input). The UI-1 semantic
  // convention (surface-interactive + edge, the SetRow/Fuel input
  // treatment) replaced it across the fasting scope; the property —
  // one consistent input chrome — is unchanged and still asserted.
  check('input chrome on the app-wide convention',
    controls.includes('bg-surface-interactive border border-edge text-ink') &&
    !controls.includes('bg-secondary'))
  check('primary action on brand tokens',
    controls.includes('bg-brand text-brand-foreground') &&
    controls.includes('hover:bg-brand-hover'))
  check('end action on critical tokens (explicit, not color-only: text label)',
    controls.includes('bg-critical-subtle text-critical border border-edge'))
  check('44px-class main actions (py-3)',
    (controls.match(/py-3 rounded-lg/g) || []).length >= 3)
  check('elevated Card retained', controls.includes('variant="elevated"'))
  check('single h3 heading retained', (controls.match(/<h3/g) || []).length === 1)
  check('labels are real <label> elements',
    (controls.match(/<label className="block text-xs/g) || []).length >= 3)
  check('no shred-card', !stripComments(controls).includes('shred-card'))
  check('no emoji', !EMOJI.test(controls) && !EMOJI.test(fastingLib))
  check('no icon library needed (no react-icons/heroicons)',
    !controls.includes('react-icons') && !controls.includes('heroicons'))
  check('toggle clears stale errors when opened',
    controls.includes('setShowManual(!showManual); setError(null)'))
}

// ── 10. Language and phase boundary ──────────────────────────────────
console.log('\n10. Language and phase boundary')
{
  check('no physiological/medical claims in changed scope',
    [controls, fastingLib].every((f) =>
      !/ketosis|autophagy|fat.?burn|detox|metaboli|toxin|cleanse/i.test(stripComments(f))))
  check('no punishment/reward language',
    [controls, fastingLib].every((f) => !/cheat|punish|reward|guilt|earn/i.test(stripComments(f))))
  check('adherence framing on the page unchanged',
    fastingPage.includes('Fasting is a calorie adherence tool — not magic.'))
  check('fasting page untouched by 5A.1',
    fastingPage.includes('<ProgressSubNav fastingEnabled={profile.fasting_enabled} />') &&
    fastingPage.includes('fetchFastingLogsThisWeek'))
  check('Coach fasting behavior untouched',
    read('src/lib/coach-actions.ts').includes('profile.fasting_enabled'))
  check('dashboard fasting widget untouched',
    read('src/components/dashboard/FastingCard.tsx').includes('metric-label'))
  check('workouts untouched (active-workout rule intact)',
    read('src/app/api/workouts/route.ts').includes(
      'workout_sessions_one_active_training_per_user_idx'))
  check('nutrition untouched',
    read('src/lib/nutrition.ts').includes('calculateNutritionTargets'))
  check('activity untouched',
    read('src/app/api/activity/route.ts').includes("Can't log steps for a future date."))
  check('profile untouched',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed'))
  check('shell invariant intact (pinned shell architecture)',
    read('src/app/(app)/layout.tsx').includes('fixed inset-0 flex overflow-hidden bg-canvas'))
  check('Select primitive untouched',
    read('src/components/ui/select.tsx').includes('border-edge bg-surface text-ink shadow-lg'))
  check('package.json untouched (22 deps)',
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('dead progress-summary untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')"))
  check('lib additions are additive (all pre-existing exports intact)',
    ['FASTING_MILESTONES', 'getFastingDuration', 'didCompleteGoal',
      'computeFastingWeekStats', 'fastingTypeFromHours', 'formatDurationHMS', 'formatDuration']
      .every((e) => fastingLib.includes(`export function ${e}`) ||
        fastingLib.includes(`export const ${e}`)))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
}

// ── 11. Edit form contract (QA correction) ───────────────────────────
console.log('\n11. Edit form contract')
{
  check('shared edit form exists as one component (controls + history reuse it)',
    controls.includes("import { EditFastForm } from './EditFastForm'") &&
    read('src/components/fasting/FastingHistory.tsx')
      .includes("import { EditFastForm } from './EditFastForm'"))
  check('edit reuses the 5A.1 validation rules (single source of truth)',
    editForm.includes('validateManualFastTimes(start, end)') &&
    !editForm.includes('new Date(start).getTime() >'))
  check('same-row update: id- and user-scoped, never insert/delete',
    editForm.includes(".eq('id', fast.id)") &&
    editForm.includes(".eq('user_id', user.id)") &&
    !editForm.includes('.insert(') && !editForm.includes('.delete('))
  check('exactly one write in the edit form',
    (editForm.match(/\.update\(/g) || []).length === 1)
  check('payload touches exactly started_at / ended_at / completed_goal',
    editForm.includes('started_at: startedAt.toISOString()') &&
    editForm.includes('ended_at: endedAt?.toISOString() ?? null') &&
    editForm.includes('completed_goal: endedAt') &&
    !editForm.includes('goal_hours:') && !editForm.includes('notes:') &&
    !editForm.includes('fasting_type:'))
  check('goal recalculated with the existing rule and the row\'s own goal',
    editForm.includes('didCompleteGoal(startedAt, endedAt, fast.goal_hours)'))
  check('reopen clears completed_goal (never a stale true on an active row)',
    editForm.includes(': null,') &&
    /completed_goal: endedAt\s*\?\s*didCompleteGoal\(startedAt, endedAt, fast.goal_hours\)\s*:\s*null/.test(editForm))
  check('prefill formats stored instants as LOCAL wall-clock',
    editForm.includes(`format(new Date(iso), "yyyy-MM-dd'T'HH:mm")`))
  check('runtime: prefill round-trips the 8 PM case exactly',
    (() => {
      const iso = new Date('2026-08-10T20:00').toISOString()
      const localValue = format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
      if (localValue !== '2026-08-10T20:00') return false
      const r = validateManualFastTimes(localValue, '', new Date('2026-08-10T22:00'))
      return r.ok && r.startedAt.getTime() === new Date('2026-08-10T20:00').getTime()
    })())
  check('no Z-append or offset arithmetic in the edit path',
    !stripComments(editForm).includes("+ 'Z'") &&
    !stripComments(editForm).includes('getTimezoneOffset'))
  check('validation precedes the conflict query precedes the write',
    editForm.indexOf('validateManualFastTimes') <
      editForm.indexOf(".is('ended_at', null)") &&
    editForm.indexOf(".is('ended_at', null)") <
      editForm.indexOf('started_at: startedAt.toISOString()'))
  check('no autosave: single explicit submit handler',
    editForm.includes('onSubmit={handleSave}') &&
    !editForm.includes('onBlur=') && !editForm.includes('useEffect'))
  check('refresh through the existing mechanism',
    editForm.includes('router.refresh()'))
  check('no service role / no API route in the edit path',
    !editForm.includes('service_role') && !editForm.includes("fetch('/api"))
}

// ── 12. Reopen semantics and conflict ────────────────────────────────
console.log('\n12. Reopen semantics and conflict')
{
  check('blank End on save = ongoing (ended_at null) — same row id retained',
    editForm.includes('ended_at: endedAt?.toISOString() ?? null') &&
    editForm.includes(".eq('id', fast.id)"))
  check('reopen conflict checked fresh before the write (not a stale prop)',
    editForm.includes(".is('ended_at', null)") &&
    editForm.includes(".neq('id', fast.id)") &&
    editForm.includes('.maybeSingle()'))
  check('editing the active fast itself is not a second-active conflict (neq id)',
    editForm.includes(".neq('id', fast.id)"))
  check('conflict copy is the explicit approved sentence',
    editForm.includes(
      "'You already have an active fast. End the current fast before reopening this one.'"))
  check('conflict aborts before any write (existing fasts untouched)',
    editForm.indexOf('setError(REOPEN_CONFLICT_COPY)') <
      editForm.indexOf('started_at: startedAt.toISOString()'))
  check('23505 race fallback maps to the same conflict sentence',
    /23505[\s\S]{0,300}REOPEN_CONFLICT_COPY/.test(editForm))
  check('no auto-end/replace/merge of the existing active fast',
    !editForm.includes('ended_at: new Date') &&
    (editForm.match(/\.update\(/g) || []).length === 1)
  check('partial unique index backstop unchanged in schema',
    schema.includes('CREATE UNIQUE INDEX fasting_logs_one_active_fast_per_user'))
  check('reopened row leaves completed history by the existing filters (no new logic)',
    fastingPage.includes(".not('ended_at', 'is', null)") &&
    fastingLib.includes('const completed = fasts.filter((f) => f.ended_at !== null)'))
  check('runtime: reopened row excluded from completed averages immediately',
    (() => {
      const s = computeFastingWeekStats([
        { started_at: '2026-08-10T20:00', ended_at: null, completed_goal: null },
        { started_at: '2026-08-08T20:00', ended_at: '2026-08-08T22:00', completed_goal: false },
      ] as any)
      return s.avgDurationMinutes === 120 && s.totalCount === 2
    })())
  check('runtime: goal recalc true/false/no-goal with corrected timestamps',
    didCompleteGoal('2026-08-10T20:00', '2026-08-11T12:30', 16) === true &&
    didCompleteGoal('2026-08-10T20:00', '2026-08-11T10:53', 16) === false &&
    didCompleteGoal('2026-08-10T20:00', '2026-08-10T20:30', null) === true)
}

// ── 13. Edit UI affordances ──────────────────────────────────────────
console.log('\n13. Edit UI affordances')
{
  const historyNow = read('src/components/fasting/FastingHistory.tsx')
  check('active fast exposes Edit fast (labeled toggle in Controls)',
    controls.includes("'Edit fast'") &&
    controls.includes('<EditFastForm fast={activeFast}'))
  check('active edit toggle clears stale errors',
    controls.includes('setShowEdit(!showEdit); setError(null)'))
  // RETARGET (UI-6B): original boundary — the Pencil icon rendered
  // bare inside a p-1.5 control. The action now sits in a real 44px
  // box with the icon aria-hidden; the labeled-Edit-near-delete
  // property is unchanged.
  check('history rows expose a labeled Edit action near delete',
    historyNow.includes('aria-label="Edit fast"') &&
    historyNow.includes('<Pencil className="w-3.5 h-3.5" aria-hidden="true" />'))
  // RETARGET (UI-6B): the goal-met checkmark glyph became a Lucide
  // CheckCircle2, so the import gained one icon; still lucide-only.
  check('lucide-only icons (Pencil + Trash2)',
    historyNow.includes("import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'"))
  check('row is not made clickable (explicit buttons only)',
    !historyNow.includes('onClick={() => setEditingId(fast.id)}\n              className="flex'))
  check('one inline edit form at a time (editingId keyed)',
    historyNow.includes('editingId === fast.id ? null : fast.id') &&
    historyNow.includes('{editingId === fast.id && ('))
  check('explicit Save changes / Cancel actions',
    editForm.includes("'Save changes'") && editForm.includes('Cancel'))
  check('helper copy: blank End keeps it ongoing',
    editForm.includes('Leave End blank to keep this fast ongoing.'))
  check('reopen consequence stated before save (completed record + cleared End)',
    editForm.includes('This fast will become active again.') &&
    editForm.includes("const willReopen = wasCompleted && end === ''"))
  check('consequence notice uses caution tokens (informational, not an error)',
    editForm.includes('text-caution bg-caution-subtle'))
  check('edit errors use critical tokens',
    editForm.includes('text-critical bg-critical-subtle'))
  check('labeled fields (Start / End (optional))',
    editForm.includes('>Start</label>') && editForm.includes('>End (optional)</label>'))
  check('no shred-card / no emoji in edit scope',
    !stripComments(editForm).includes('shred-card') && !EMOJI.test(editForm))
  check('no legacy tokens in edit scope',
    ['text-muted-foreground', 'border-border', 'bg-accent', 'bg-primary', 'destructive']
      .every((t) => !editForm.includes(t)))
}

// ── 14. Edit regressions ─────────────────────────────────────────────
console.log('\n14. Edit regressions')
{
  const historyNow = read('src/components/fasting/FastingHistory.tsx')
  check('delete flow unchanged (confirm + same client delete + Trash2)',
    historyNow.includes("if (!confirm('Delete this fasting log?')) return") &&
    historyNow.includes(".from('fasting_logs').delete().eq('id', id)") &&
    historyNow.includes('aria-label="Delete fast"'))
  check('history still renders completed rows only',
    historyNow.includes('const completed = fasts.filter((f) => f.ended_at !== null)'))
  check('history duration still derived from timestamps',
    historyNow.includes('getFastingDuration(fast.started_at, fast.ended_at)'))
  check('history goal badge on semantic token (in-file sweep)',
    historyNow.includes('text-success') && !historyNow.includes('text-green-400'))
  check('history delete hover on semantic token',
    historyNow.includes('hover:text-critical') && !historyNow.includes('destructive'))
  check('history card variants unchanged (4B.5 pins)',
    historyNow.includes('variant="default"') && historyNow.includes('variant="status"'))
  check('manual ongoing creation still intact after correction',
    controls.includes('if (!endedAt && activeFast) {') &&
    controls.includes('Leave End blank to start an ongoing fast from this time.'))
  check('Start fast now / End fast flows untouched',
    controls.includes("'Start fast now'") && controls.includes("'End fast'") &&
    controls.includes('didCompleteGoal(activeFast.started_at, endedAt, activeFast.goal_hours)'))
  check('timer and stats components still untouched',
    !timer.includes('EditFastForm') && !stats.includes('EditFastForm'))
  check('no second timer introduced',
    (fastingPage.match(/<FastingTimer/g) || []).length === 1)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
