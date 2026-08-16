// ============================================================
// ForgeFitOS — Phase 5A.3 deterministic verification harness
// Verifies intentional activity sessions: migration 015, the strict
// three-table boundary (strength / intentional sessions / passive
// daily steps), server-authoritative writes with manual-only
// provenance, optional start-time semantics, canonical distance,
// the local-time helper relocation — and that nothing outside the
// approved scope changed. Validation, conversion, and label logic
// execute at RUNTIME against the real lib helpers.
// Run from the repository root:
//   npx tsx scripts/verify-phase5a3.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  isActivityType,
  METERS_PER_MILE,
  milesToMeters,
  metersToMiles,
  validateActivitySessionInput,
  formatActivityDuration,
  formatActivityDistance,
  ACTIVITY_FUTURE_TOLERANCE_MS,
  ACTIVITY_MAX_DURATION_MINUTES,
} from '../src/lib/activity'
import { composeTime12To24, splitTime24To12 } from '../src/lib/local-time'
import { averageDailySteps, computeWeeklyActivity, STEP_WEEK_DAYS } from '../src/lib/weekly-review'

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
const stripSql = (s: string) => s.replace(/^--.*$/gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const migration = read('supabase/migrations/015_phase5a3_activity_sessions.sql')
const types = read('src/types/database.ts')
const activityLib = read('src/lib/activity.ts')
const localTime = read('src/lib/local-time.ts')
const workoutLib = read('src/lib/workout.ts')
const postRoute = read('src/app/api/activity-sessions/route.ts')
const idRoute = read('src/app/api/activity-sessions/[id]/route.ts')
const stepsRoute = read('src/app/api/activity/route.ts')
const addForm = read('src/components/activity/AddActivityForm.tsx')
const list = read('src/components/activity/ActivitySessionList.tsx')
const page = read('src/app/(app)/activity/page.tsx')
const stepsForm = read('src/components/activity/ActivityLogForm.tsx')
const serverLib = read('src/lib/supabase/server.ts')
const pastForm = read('src/components/workout/LogPastWorkoutForm.tsx')
const header = read('src/components/workout/SessionHeader.tsx')
const notes = read('docs/phase5a3-activity-sessions-notes.md')

const CHANGED = [postRoute, idRoute, addForm, list, page, activityLib]

// ── 1. Checkpoint and migration 015 ──────────────────────────────────
console.log('\n1. Checkpoint and migration 015')
{
  check('checkpoint artifacts exist (c2621af tree)',
    ['scripts/verify-phase5a2.ts', 'docs/phase5a2-historical-workouts-notes.md',
      'src/components/workout/LogPastWorkoutForm.tsx',
      'supabase/migrations/014_phase5a2_workout_capture_metadata.sql']
      .every((f) => existsSync(f)))
  check('5A.3 notes exist', notes.length > 1500)
  // RETARGETED (5A.4): 017 is that approved phase's migration, so the
  // boundary this pin protects is now "5A.3 added exactly 015 + 016"
  // rather than a total count that every later phase would break.
  check('5A.3 migration boundary: added exactly 015 + 016 (no 016b/duplicates)',
    existsSync('supabase/migrations/015_phase5a3_activity_sessions.sql') &&
    existsSync('supabase/migrations/016_phase5a3_activity_session_grants.sql') &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('015') || f.startsWith('016')).length === 2)
  check('migration creates activity_sessions',
    migration.includes('CREATE TABLE activity_sessions ('))
  const COLUMNS = [
    'id               UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'user_id          UUID NOT NULL',
    'activity_type    TEXT NOT NULL',
    'activity_date    DATE NOT NULL',
    'started_at       TIMESTAMPTZ',
    'duration_seconds INTEGER NOT NULL',
    'distance_meters  NUMERIC(10,2)',
    'calories_burned  INTEGER',
    'source           TEXT NOT NULL',
    'notes            TEXT',
  ]
  for (const c of COLUMNS) {
    check(`column: ${c.split(/\s+/)[0]}`, migration.includes(c))
  }
  check('user FK cascades', migration.includes('ON DELETE CASCADE'))
  check('duration CHECK > 0', migration.includes('CHECK (duration_seconds > 0)'))
  check('distance CHECK > 0 and nullable',
    migration.includes('CHECK (distance_meters > 0)') &&
    !migration.includes('distance_meters  NUMERIC(10,2) NOT NULL'))
  check('calories CHECK >= 0 and nullable',
    migration.includes('CHECK (calories_burned >= 0)') &&
    !migration.includes('calories_burned  INTEGER NOT NULL'))
  check('source has NO DEFAULT (every writer states provenance)',
    (() => {
      const sql = stripSql(migration)
      const col = sql.slice(sql.indexOf('source           TEXT NOT NULL'),
        sql.indexOf('notes            TEXT'))
      return col.length > 0 && !col.includes('DEFAULT')
    })())
  check('source CHECK is exactly manual/live/imported — no legacy',
    (() => {
      const sql = stripSql(migration)
      return sql.includes("'manual',") && sql.includes("'live',") &&
        sql.includes("'imported'") && !sql.includes("'legacy'")
    })())
  check('no steps column / no ended_at / no title / no provider / no metadata',
    ['steps', 'ended_at', 'title', 'provider', 'metadata', 'JSONB']
      .every((t) => !stripSql(migration).includes(t)))
  check('no workout FK / no nutrition references',
    !stripSql(migration).includes('workout_sessions(') &&
    !stripSql(migration).includes('nutrition'))
  check('no uniqueness constraint (multiple sessions per day are valid)',
    !migration.includes('UNIQUE'))
  check('updated_at trigger uses the project convention',
    migration.includes('FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'))
  check('user+date-descending index',
    migration.includes('CREATE INDEX activity_sessions_user_date_idx') &&
    migration.includes('ON activity_sessions (user_id, activity_date DESC)'))
  check('RLS enabled', migration.includes('ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY'))
  for (const op of ['select', 'insert', 'update', 'delete']) {
    check(`own-row policy: ${op}`, migration.includes(`activity_sessions_${op}_own`))
  }
  check('PostgREST reload notify', migration.includes("NOTIFY pgrst, 'reload schema';"))
  check('boundary documented in the migration',
    migration.includes('NEVER write steps') && migration.includes('informational only'))
}

// ── 2. Types ─────────────────────────────────────────────────────────
console.log('\n2. Types')
{
  check('ActivitySource union exact (no legacy)',
    types.includes("export type ActivitySource = 'manual' | 'live' | 'imported'"))
  check('session interface fields',
    ['activity_type: string', "activity_date: string", 'started_at: string | null',
      'duration_seconds: number', 'distance_meters: number | null',
      'calories_burned: number | null', 'source: ActivitySource']
      .every((f) => types.includes(f)))
  check('update type can never carry source',
    types.includes("ActivitySessionUpdate = Partial<Omit<ActivitySession,'id'|'user_id'|'source'|'created_at'>>"))
  check('NULL-vs-0 and canonical-meters contracts documented',
    types.includes('NULL = not recorded, 0 = explicitly zero') &&
    types.includes('canonical meters'))
}

// ── 3. Activity vocabulary (runtime) ─────────────────────────────────
console.log('\n3. Activity vocabulary (runtime)')
{
  check('exactly nine types in the approved order',
    JSON.stringify([...ACTIVITY_TYPES]) === JSON.stringify(
      ['walk', 'run', 'cycle', 'hike', 'row', 'elliptical', 'stair_climber', 'swim', 'other']))
  const LABELS: Record<string, string> = {
    walk: 'Walk', run: 'Run', cycle: 'Cycling', hike: 'Hike', row: 'Rowing',
    elliptical: 'Elliptical', stair_climber: 'Stair climber', swim: 'Swimming', other: 'Other',
  }
  for (const t of ACTIVITY_TYPES) {
    check(`friendly label: ${t} -> ${LABELS[t]}`, ACTIVITY_TYPE_LABELS[t] === LABELS[t])
  }
  check('unknown types rejected', !isActivityType('jog') && !isActivityType('') &&
    !isActivityType(null) && !isActivityType(42))
  check('known type accepted', isActivityType('walk') && isActivityType('other'))
  check('vocabulary mirrors the migration CHECK',
    ACTIVITY_TYPES.every((t) => migration.includes(`'${t}'`)))
}

// ── 4. Canonical distance (runtime) ──────────────────────────────────
console.log('\n4. Canonical distance (runtime)')
{
  check('shared conversion constant', METERS_PER_MILE === 1609.34)
  check('1 mile -> 1609.34 m', milesToMeters(1) === 1609.34)
  check('2.3 miles -> 3701.48 m (2dp)', milesToMeters(2.3) === 3701.48)
  check('meters -> miles display 2dp', metersToMiles(3701.48) === 2.3)
  check('edit round-trip stable at 2dp precision',
    [0.25, 1, 2.3, 5.5, 13.1, 26.2].every((mi) => metersToMiles(milesToMeters(mi)) === mi))
  check('format helper renders miles', formatActivityDistance(3701.48) === '2.3 mi')
  check('duration formatting', formatActivityDuration(2700) === '45m' &&
    formatActivityDuration(5400) === '1h 30m' && formatActivityDuration(3060) === '51m')
}

// ── 5. Validation (runtime) ──────────────────────────────────────────
console.log('\n5. Validation (runtime)')
{
  const TODAY = '2026-08-11'
  const now = new Date('2026-08-11T14:46:00')
  const v = (input: Record<string, unknown>) =>
    validateActivitySessionInput(input as any, TODAY, now)
  const base = { activityType: 'walk', activityDate: '2026-08-10', durationMinutes: 45 }

  check('valid date-only walk accepted; started_at NULL',
    (() => { const r = v(base); return r.ok && r.startedAt === null && r.durationSeconds === 2700 })())
  check('unknown activity type rejected',
    !v({ ...base, activityType: 'jog' }).ok &&
    (v({ ...base, activityType: 'jog' }) as any).error === 'Choose an activity type.')
  check('malformed date rejected',
    !v({ ...base, activityDate: 'Aug 10' }).ok && !v({ ...base, activityDate: '' }).ok)
  check('date-only future rule: tomorrow rejected',
    !v({ ...base, activityDate: '2026-08-12' }).ok &&
    (v({ ...base, activityDate: '2026-08-12' }) as any).error ===
      'Activity date cannot be in the future.')
  check('date-only today accepted', v({ ...base, activityDate: TODAY }).ok)
  check('historical date accepted (no age limit)', v({ ...base, activityDate: '2026-07-01' }).ok)
  check('blank/omitted startTime -> ongoing-less record (started_at NULL)',
    (() => {
      const a = v({ ...base, startTime: '' }); const b = v({ ...base, startTime: null })
      return a.ok && a.startedAt === null && b.ok && b.startedAt === null
    })())
  check('partial/malformed time rejected with the segmented-control copy',
    !v({ ...base, startTime: '9:00' }).ok &&
    (v({ ...base, startTime: '9:00' }) as any).error === 'Enter a complete start time.')
  check('complete local time accepted and preserved (8 PM stays hour 20)',
    (() => {
      const r = v({ ...base, startTime: '20:00' })
      return r.ok && r.startedAt !== null && r.startedAt.getHours() === 20 &&
        r.startedAt.getDate() === 10
    })())
  check('composed 12 AM maps to midnight through validation',
    (() => {
      const t = composeTime12To24('12', '00', 'AM')
      const r = v({ ...base, startTime: t })
      return t === '00:00' && r.ok && r.startedAt !== null && r.startedAt.getHours() === 0
    })())
  check('composed 12 PM maps to noon', (() => {
    const t = composeTime12To24('12', '00', 'PM')
    const r = v({ ...base, startTime: t })
    return t === '12:00' && r.ok && r.startedAt !== null && r.startedAt.getHours() === 12
  })())
  check('composed 1 PM accepted same-day when now is 2:46 PM',
    v({ ...base, activityDate: TODAY, startTime: composeTime12To24('1', '00', 'PM') }).ok)
  check('+1 minute accepted within the 2-minute skew tolerance',
    v({ ...base, activityDate: TODAY, startTime: '14:47' }).ok &&
    ACTIVITY_FUTURE_TOLERANCE_MS === 2 * 60 * 1000)
  check('+3 minutes rejected',
    !v({ ...base, activityDate: TODAY, startTime: '14:49' }).ok &&
    (v({ ...base, activityDate: TODAY, startTime: '14:49' }) as any).error ===
      'Start time cannot be in the future.')
  check('11:30 PM yesterday accepted; midnight-crossing keeps activity_date',
    (() => {
      const r = v({ ...base, startTime: '23:30', durationMinutes: 60 })
      return r.ok && r.activityDate === '2026-08-10' && r.startedAt !== null &&
        new Date(r.startedAt.getTime() + r.durationSeconds * 1000).getDate() === 11
    })())
  check('duration required / integer / > 0',
    !v({ ...base, durationMinutes: 0 }).ok && !v({ ...base, durationMinutes: -5 }).ok &&
    !v({ ...base, durationMinutes: 45.5 }).ok && !v({ ...base, durationMinutes: NaN }).ok)
  check('duration boundary: 1440 accepted, 1441 rejected',
    v({ ...base, durationMinutes: 1440 }).ok && !v({ ...base, durationMinutes: 1441 }).ok &&
    ACTIVITY_MAX_DURATION_MINUTES === 1440)
  check('1-minute activity accepted (no invented minimum)',
    v({ ...base, durationMinutes: 1 }).ok)
  check('distance blank -> NULL',
    (() => { const r = v({ ...base, distanceMiles: '' }); return r.ok && r.distanceMeters === null })())
  check('distance 2.3 miles -> canonical 3701.48 m',
    (() => { const r = v({ ...base, distanceMiles: '2.3' }); return r.ok && r.distanceMeters === 3701.48 })())
  check('zero/negative/malformed distance rejected',
    !v({ ...base, distanceMiles: 0 }).ok && !v({ ...base, distanceMiles: -1 }).ok &&
    !v({ ...base, distanceMiles: 'far' }).ok && !v({ ...base, distanceMiles: Infinity }).ok)
  check('calories blank -> NULL; 0 -> explicit 0; string int accepted',
    (() => {
      const a = v({ ...base, caloriesBurned: '' })
      const b = v({ ...base, caloriesBurned: 0 })
      const c = v({ ...base, caloriesBurned: '180' })
      return a.ok && a.caloriesBurned === null && b.ok && b.caloriesBurned === 0 &&
        c.ok && c.caloriesBurned === 180
    })())
  check('negative/decimal calories rejected',
    !v({ ...base, caloriesBurned: -1 }).ok && !v({ ...base, caloriesBurned: 12.5 }).ok)
  check('notes trimmed; blank -> NULL; over-length rejected',
    (() => {
      const a = v({ ...base, notes: '  windy loop  ' })
      const b = v({ ...base, notes: '   ' })
      const c = v({ ...base, notes: 'x'.repeat(2001) })
      return a.ok && a.notes === 'windy loop' && b.ok && b.notes === null && !c.ok
    })())
  check('validator is pure (same input, same result)',
    JSON.stringify(v(base)) === JSON.stringify(v(base)))
}

// ── 6. Local-time relocation (Required Change #2) ────────────────────
console.log('\n6. Local-time relocation')
{
  check('neutral module owns both helpers',
    localTime.includes('export function composeTime12To24') &&
    localTime.includes('export function splitTime24To12'))
  check('lib/workout no longer defines them (single home)',
    !workoutLib.includes('export function composeTime12To24') &&
    !workoutLib.includes('export function splitTime24To12'))
  check('workout forms import from local-time',
    pastForm.includes("from '@/lib/local-time'") &&
    header.includes("from '@/lib/local-time'"))
  check('activity forms import from local-time',
    addForm.includes("from '@/lib/local-time'") &&
    list.includes("from '@/lib/local-time'"))
  check('behavior byte-equivalent (runtime spot checks)',
    composeTime12To24('12', '00', 'AM') === '00:00' &&
    composeTime12To24('11', '30', 'PM') === '23:30' &&
    JSON.stringify(splitTime24To12('13:05')) ===
      JSON.stringify({ hour12: '1', minute: '05', meridiem: 'PM' }))
  check('full 24-hour round-trip stability preserved',
    Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:45`)
      .every((t) => {
        const p = splitTime24To12(t)
        return p !== null && composeTime12To24(p.hour12, p.minute, p.meridiem) === t
      }))
  check('workout segmented forms unchanged semantically (5A.2 anchors intact)',
    pastForm.includes('composeTime12To24(startHour, startMinute, startMeridiem)') &&
    header.includes('composeTime12To24(detailsHour, detailsMinute, detailsMeridiem)') &&
    header.includes("splitTime24To12(format(new Date(session.start_time), 'HH:mm'))"))
}

// ── 7. Server write contracts ────────────────────────────────────────
console.log('\n7. Server write contracts')
{
  check('create route authenticates',
    postRoute.includes("if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })"))
  check('create validates through the shared pure helper',
    postRoute.includes('validateActivitySessionInput('))
  check('create derives every persisted field server-side',
    ['user_id: user.id', 'activity_type: activityType', 'activity_date: activityDate',
      'started_at: startedAt?.toISOString() ?? null', 'duration_seconds: durationSeconds',
      'distance_meters: distanceMeters', 'calories_burned: caloriesBurned']
      .every((f) => postRoute.includes(f)))
  check('create writes source manual — server-supplied, never client-selectable',
    postRoute.includes("source: 'manual',") &&
    !postRoute.includes('body.source') && !postRoute.includes('body.id') &&
    !postRoute.includes('body.user_id'))
  check('201 on creation', postRoute.includes('{ status: 201 }'))
  check('date-only backstop documented (server cannot know user timezone)',
    postRoute.includes('serverTodayWithSkew'))
  check('edit payload restricted to the seven editable fields',
    idRoute.includes("'activityType', 'activityDate', 'startTime', 'durationMinutes',") &&
    idRoute.includes("'distanceMiles', 'caloriesBurned', 'notes',") &&
    idRoute.includes('Unsupported fields for activity correction.'))
  check('edit enforces ownership then manual-only provenance',
    idRoute.includes(".eq('user_id', user.id)") &&
    idRoute.includes("if (session.source !== 'manual')") &&
    idRoute.includes('Only manually logged activities can be edited.'))
  check('unknown/unowned id -> 404',
    idRoute.includes("{ error: 'Not found' }, { status: 404 }"))
  check('edit update payload can never carry id/user_id/source/created_at',
    (() => {
      const branch = idRoute.slice(idRoute.indexOf('.update({'))
      const payload = branch.slice(0, branch.indexOf('})'))
      return payload.includes('activity_type') && !payload.includes('source') &&
        !payload.includes('user_id:') && !payload.includes('created_at')
    })())
  check('removing the start time clears started_at to NULL',
    idRoute.includes('started_at: startedAt?.toISOString() ?? null'))
  check('delete enforces ownership + manual-only, single row',
    idRoute.includes('Only manually logged activities can be deleted.') &&
    idRoute.includes(".delete()") && !idRoute.includes('.in(') &&
    (idRoute.match(/\.delete\(\)/g) || []).length === 1)
  check('no bulk/destructive endpoints',
    !postRoute.includes('DELETE') && !idRoute.includes('deleteMany'))
  check('routes never touch other tables',
    ['daily_activity_logs', 'nutrition_targets', 'food_logs', 'workout_sessions']
      .every((t) => !postRoute.includes(t) && !idRoute.includes(t)))
  check('read helper is read-only and recent-first',
    serverLib.includes('fetchRecentActivitySessions') &&
    serverLib.includes(".order('activity_date', { ascending: false })"))
}

// ── 8. UI contract ───────────────────────────────────────────────────
console.log('\n8. UI contract')
{
  check('Intentional activity section mounted below the passive content',
    page.includes('>Intentional activity</h2>') &&
    page.indexOf('Last 7 days') < page.indexOf('Intentional activity') &&
    page.includes('<AddActivityForm />') &&
    page.includes('<ActivitySessionList sessions={activitySessions} />'))
  check('passive steps flow intact; form keyed per date (QA correction)',
    page.includes('fetchActivityLogForDate(supabase, user.id, date)') &&
    page.includes('<ActivityLogForm key={date} date={date} existingLog={existingLog} isFutureDate={isFutureDate} />') &&
    page.includes('aria-label="Previous day"') && page.includes('Last 7 days'))
  check('Add activity toggle with lucide icon',
    addForm.includes("'Add activity'") &&
    addForm.includes("import { Footprints } from 'lucide-react'"))
  check('full type selector defaulting to Walk',
    addForm.includes("useState('walk')") && addForm.includes('ACTIVITY_TYPES.map'))
  check('explicit optional-time toggle (no false-complete ambiguity)',
    addForm.includes('Add start time') && addForm.includes('withStartTime') &&
    list.includes('Add start time'))
  check('segmented control only appears when the toggle is on',
    addForm.includes('{withStartTime && (') && list.includes('{withStartTime && ('))
  check('segmented group + accessible sub-labels (both forms)',
    [addForm, list].every((f) =>
      f.includes('role="group" aria-label="Start time"') &&
      f.includes('aria-label="Hour"') && f.includes('aria-label="Minute"') &&
      f.includes('aria-label="AM or PM"')))
  check('hour/AM-PM placeholders; minute visibly 00',
    [addForm, list].every((f) =>
      f.includes('<option value="">Hour</option>') &&
      f.includes('<option value="">AM/PM</option>')))
  check('no native time input anywhere in activity scope',
    !addForm.includes('type="time"') && !list.includes('type="time"'))
  check('incomplete segments guarded with the exact copy (both forms)',
    (addForm.match(/Enter a complete start time\./g) || []).length >= 1 &&
    (list.match(/Enter a complete start time\./g) || []).length >= 1)
  check('duration bounds mirrored natively', addForm.includes('max="1440"') &&
    list.includes('max="1440"'))
  check('distance entered in miles with honest placeholder',
    addForm.includes('Distance (miles, optional)') &&
    addForm.includes('placeholder="Not recorded"'))
  check('calories optional with honest placeholder',
    addForm.includes('Calories burned (optional)'))
  check('list renders type label, duration, conditional distance/calories',
    list.includes('formatActivityDuration(session.duration_seconds)') &&
    list.includes('{session.distance_meters !== null && (') &&
    list.includes('{session.calories_burned !== null && ('))
  check('calories NULL omitted, explicit 0 renders (strict !== null)',
    list.includes('session.calories_burned !== null') &&
    !list.includes('session.calories_burned &&'))
  check('edit prefill via shared helpers (local time + canonical miles)',
    list.includes("splitTime24To12(format(new Date(session.started_at), 'HH:mm'))") &&
    list.includes('String(metersToMiles(session.distance_meters))'))
  check('NULL start prefills the toggle off',
    list.includes('useState(startParts !== null)'))
  check('manual-only correction affordances',
    list.includes("session.source === 'manual'") && list.includes('{isManual && ('))
  check('labeled edit/delete with confirm (established pattern)',
    list.includes('aria-label="Edit activity"') &&
    list.includes('aria-label="Delete activity"') &&
    list.includes("confirm('Delete this activity?')"))
  check('explicit Save/Cancel, no autosave',
    list.includes("'Save changes'") && list.includes('Cancel') &&
    addForm.includes("'Save activity'") &&
    !addForm.includes('onBlur=') && !list.includes('onBlur='))
  check('empty state present', list.includes('No intentional activities logged yet.'))
  check('responsive: 1-col mobile pairs, min-w-0 everywhere, no overflow constructs',
    [addForm, list].every((f) =>
      f.includes('grid grid-cols-1 sm:grid-cols-2 gap-2') &&
      f.includes('grid grid-cols-3 gap-1 min-w-0') &&
      !f.includes('overflow-x') && !f.includes('h-screen') && !f.includes('dvh')))
  check('semantic tokens; no legacy; no shred-card; no emoji',
    [addForm, list].every((f) =>
      !f.includes('text-muted-foreground') && !f.includes('border-border') &&
      !f.includes('bg-primary') && !f.includes('destructive') &&
      !stripComments(f).includes('shred-card') && !EMOJI.test(f)))
  check('44px-class primary actions', addForm.includes('min-h-11') &&
    addForm.includes('py-3 rounded-lg bg-brand'))
}

// ── 9. Boundary and double-counting contract ─────────────────────────
console.log('\n9. Boundary and double-counting')
{
  // RETARGETED (5A.4): the route legitimately gained daily distance,
  // so byte-anchoring is gone — the boundary this pin protects
  // (future-date rule, the one upsert path, and no activity_sessions
  // code) is checked on comment-stripped source instead.
  check('existing /api/activity boundary intact (future rule, upsert path, no session code)',
    stepsRoute.includes("Can't log steps for a future date.") &&
    stepsRoute.includes('upsertActivityLogForDate') &&
    !stripComments(stepsRoute).includes('activity_sessions'))
  check('steps form untouched', stepsForm.includes("fetch('/api/activity'") &&
    !stepsForm.includes('activity_sessions'))
  check('activity scope never references daily steps or nutrition tables',
    [postRoute, idRoute, addForm, list].every((f) =>
      !f.includes('daily_activity_logs') && !f.includes('nutrition_targets') &&
      !f.includes('food_logs')))
  // RETARGETED (5A.4): lib/activity.ts now also hosts the DAILY
  // aggregate movement validator, which legitimately names steps —
  // the session-scoped files keep the plain ban, and the lib is
  // pinned against any steps<->distance derivation instead.
  check('no step derivation or step writes from sessions',
    [postRoute, idRoute, addForm, list].every((f) =>
      !stripComments(f).includes('steps')) &&
    !/stride|stepsFromDistance|distanceFromSteps|stepsPerMile|toSteps/i
      .test(stripComments(activityLib)))
  check('no eat-back / net-calorie language',
    CHANGED.every((f) => !/eat.?back|net calorie|calorie credit|earned food/i
      .test(stripComments(f))))
  check('weekly review has no activity_sessions consumer (comments aside)',
    !stripComments(read('src/lib/weekly-review.ts')).includes('activity_sessions'))
  check('Coach has no activity_sessions consumer',
    !read('src/lib/coach-actions.ts').includes('activity_sessions'))
  check('Progress overview has no activity_sessions consumer',
    !read('src/lib/progress-overview.ts').includes('activity_sessions'))
  check('nutrition math untouched',
    !read('src/lib/nutrition.ts').includes('activity_sessions') &&
    read('src/lib/nutrition.ts').includes('calculateNutritionTargets'))
  check('the only new reader is the /activity page itself',
    page.includes('fetchRecentActivitySessions(supabase, user.id, 10)'))
}

// ── 10. Regression and phase boundary ────────────────────────────────
console.log('\n10. Regression and phase boundary')
{
  check('workout historical flow untouched (5A.2 anchors)',
    read('src/app/api/workouts/route.ts').includes("if (earlyBody.mode === 'historical') {") &&
    read('src/app/api/workouts/route.ts').includes("source: 'manual',"))
  check('manual workout metadata PATCH untouched',
    read('src/app/api/workouts/[id]/route.ts').includes("if (body.mode === 'manual_metadata') {"))
  check('workout complete route untouched',
    read('src/app/api/workouts/[id]/complete/route.ts')
      .includes('end_time: existing.end_time ?? nowIso,'))
  check('fasting (5A.1) untouched',
    read('src/components/fasting/FastingControls.tsx')
      .includes('Leave End blank to start an ongoing fast from this time.'))
  check('shell invariant intact',
    read('src/app/(app)/layout.tsx').includes('fixed inset-0 flex overflow-hidden bg-canvas'))
  check('package.json untouched (22 deps)',
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('dead progress-summary untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')"))
  check('no live timer / no integrations implemented',
    [addForm, list, postRoute, idRoute].every((f) =>
      !/healthkit|apple health|strava|garmin|fitbit|start walk/i.test(stripComments(f))))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
  check('notes document the boundary, server-write decision, and relocation',
    notes.includes('three-table boundary') || notes.includes('Three-table boundary'))
  check('notes record both deferred roadmap items',
    notes.includes('Multi-muscle') && notes.includes('macro'))
  check('5A.2 migration pin retarget documented',
    notes.includes('retarget'))
}

// ── 11. Extended runtime coverage ────────────────────────────────────
console.log('\n11. Extended runtime coverage')
{
  const TODAY = '2026-08-11'
  const now = new Date('2026-08-11T14:46:00')
  const v = (input: Record<string, unknown>) =>
    validateActivitySessionInput(input as any, TODAY, now)

  for (const t of ACTIVITY_TYPES) {
    check(`every vocabulary type validates: ${t}`,
      v({ activityType: t, activityDate: '2026-08-10', durationMinutes: 30 }).ok)
  }
  for (const mi of [0.1, 0.25, 1, 2.3, 3.14, 5.5, 13.1, 26.2]) {
    check(`distance round-trip stable: ${mi} mi`,
      metersToMiles(milesToMeters(mi)) === mi)
  }
  const hourCases: Array<[string, string, number]> = [
    ['1', 'AM', 1], ['6', 'AM', 6], ['11', 'AM', 11],
    ['12', 'PM', 12], ['5', 'PM', 17], ['11', 'PM', 23],
  ]
  for (const [h, mer, expect] of hourCases) {
    check(`composed ${h}:15 ${mer} validates to local hour ${expect}`,
      (() => {
        const t = composeTime12To24(h, '15', mer)
        const r = v({ activityType: 'walk', activityDate: '2026-08-10',
          startTime: t, durationMinutes: 30 })
        return t !== null && r.ok && r.startedAt !== null &&
          r.startedAt.getHours() === expect
      })())
  }
  check('duration formatting hour boundary', formatActivityDuration(3600) === '1h 0m' &&
    formatActivityDuration(3540) === '59m')
  check('insert type exists for completeness',
    types.includes('export type ActivitySessionInsert'))
  check('migration ordering documented', migration.includes('Run AFTER 014'))
}

// ── 12. Granular UI pins ─────────────────────────────────────────────
console.log('\n12. Granular UI pins')
{
  for (const label of ['Activity type', 'Date', 'Duration (minutes)',
    'Distance (miles, optional)', 'Calories burned (optional)', 'Notes (optional)']) {
    check(`add form labels field: ${label}`, addForm.includes(`>${label}</label>`))
  }
  for (const label of ['Activity type', 'Date', 'Duration (minutes)',
    'Distance (miles, optional)', 'Calories burned (optional)', 'Notes (optional)']) {
    check(`edit form labels field: ${label}`, list.includes(`>${label}</label>`))
  }
  check('list date rendering follows the app convention',
    list.includes("format(parseISO(session.activity_date), 'EEE, MMM d')"))
  check('start time shown only when known',
    list.includes("session.started_at ? ` · ${formatTime(new Date(session.started_at))}` : ''"))
  check('page keeps the step-goal line and 7-day grid (label now 7-day avg)',
    page.includes('Daily goal: {stepGoal.toLocaleString()} steps') &&
    page.includes('days logged') && page.includes('7-day avg') && page.includes('goal days'))
  check('page section is additive (single new h2, existing h1 untouched)',
    (page.match(/>Intentional activity<\/h2>/g) || []).length === 1 &&
    page.includes('>Activity</h1>'))
  check('create POST targets the sessions domain, not the steps endpoint',
    addForm.includes("fetch('/api/activity-sessions'") &&
    !addForm.includes("fetch('/api/activity'"))
  check('edit/delete target the id route',
    list.includes('`/api/activity-sessions/${session.id}`') &&
    list.includes('`/api/activity-sessions/${id}`'))
  check('server responses follow the repo convention ({ data } / { success })',
    postRoute.includes('NextResponse.json({ data }, { status: 201 })') &&
    idRoute.includes('NextResponse.json({ success: true })'))
  check('5A.2 harness still runs against the relocated helpers (retarget in place)',
    read('scripts/verify-phase5a2.ts').includes("from '../src/lib/local-time'") &&
    read('scripts/verify-phase5a2.ts').includes('5A.2 added only migration 014'))
}

// ── 13. Authoritative weekly step average (QA correction, runtime) ───
console.log('\n13. Weekly step average (runtime)')
{
  const weekly = read('src/lib/weekly-review.ts')
  const checkin = read('src/app/(app)/check-in/page.tsx')

  // The user-approved fixture: 10,000 / 8,000 / missing / 12,000 /
  // 9,000 / 6,000 / 11,000 -> 56,000 / 7 = 8,000. Correcting the
  // 6,000 day to 12,000 -> 62,000 / 7 -> 8,857 (Math.round, the UI's
  // existing convention).
  check('fixture: 56,000 across the 7-day window -> 8,000',
    averageDailySteps(10000 + 8000 + 0 + 12000 + 9000 + 6000 + 11000) === 8000)
  check('fixture: yesterday corrected 6,000 -> 12,000 gives 62,000/7 -> 8,857',
    averageDailySteps(10000 + 8000 + 0 + 12000 + 9000 + 12000 + 11000) === 8857)
  check('missing days count as zero (never divided by logged rows)',
    averageDailySteps(56000) === 8000 && STEP_WEEK_DAYS === 7)
  check('reducer applies the same rule with in-window filtering (runtime)',
    (() => {
      const bounds = { startDate: '2026-08-05', endDate: '2026-08-11' } as any
      const rows = [
        { logged_date: '2026-08-05', steps: 10000 }, // oldest boundary day included
        { logged_date: '2026-08-06', steps: 8000 },
        { logged_date: '2026-08-08', steps: 12000 },
        { logged_date: '2026-08-09', steps: 9000 },
        { logged_date: '2026-08-10', steps: 6000 },  // yesterday included
        { logged_date: '2026-08-11', steps: 11000 },
        { logged_date: '2026-08-04', steps: 99999 }, // day before boundary excluded
        { logged_date: '2026-08-12', steps: 99999 }, // tomorrow excluded
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.averageSteps === 8000 && a.loggedDays === 6 && a.totalSteps === 56000
    })())
  check('correcting yesterday changes the aggregate deterministically (runtime)',
    (() => {
      const bounds = { startDate: '2026-08-05', endDate: '2026-08-11' } as any
      const rows = [
        { logged_date: '2026-08-05', steps: 10000 },
        { logged_date: '2026-08-06', steps: 8000 },
        { logged_date: '2026-08-08', steps: 12000 },
        { logged_date: '2026-08-09', steps: 9000 },
        { logged_date: '2026-08-10', steps: 12000 }, // corrected
        { logged_date: '2026-08-11', steps: 11000 },
      ]
      return computeWeeklyActivity(rows, bounds).averageSteps === 8857
    })())
  // RETARGET (LOCAL-DATE-FIX): same 7-day window, computed with pure
  // date-string math anchored to the user's local today.
  check('trailing window on /activity: today + previous 6 local days, inclusive fetch',
    page.includes('addDaysISO(todayStr, -6)') &&
    serverLib.includes(".gte('logged_date', startDate)") &&
    serverLib.includes(".lte('logged_date', endDate)"))
  check('local calendar dates end-to-end (no UTC shift in todayISO)',
    read('src/lib/dates.ts').includes("return formatDateISO(new Date())") &&
    read('src/lib/dates.ts').includes("format(date, 'yyyy-MM-dd')"))
  check('every live consumer shares the single helper (no logged-days division left)',
    page.includes('averageDailySteps(recentLogs.reduce') &&
    (weekly.match(/averageDailySteps\(/g) || []).length >= 3 &&
    !weekly.includes('/ stepLoggedDays') && !weekly.includes('/ loggedDays') &&
    !page.includes('/ loggedDays'))
  check('/activity label matches the calculation', page.includes('>7-day avg</p>'))
  check('check-in label matches the calculation',
    checkin.includes('average daily steps this week') &&
    !checkin.includes('across logged days'))
  check('completeness signal retained everywhere',
    page.includes('days logged') && checkin.includes('of 7 days logged'))
  check('empty week still renders honest empty states (no fake zero average)',
    (() => {
      const a = computeWeeklyActivity([], { startDate: '2026-08-05', endDate: '2026-08-11' } as any)
      return a.averageSteps === null && a.totalSteps === null && a.loggedDays === 0
    })())
  check('activity_sessions never enter the step aggregate (no session reads near it)',
    !stripComments(weekly).includes('activity_sessions') &&
    !stripComments(page).includes('activitySessions.reduce') &&
    !stripComments(read('src/lib/activity.ts')).includes('daily_activity_logs'))
  check('no distance->steps or calories->steps conversion anywhere',
    ['stepsFromDistance', 'distanceToSteps', 'caloriesToSteps']
      .every((t) => !read('src/lib/activity.ts').includes(t) && !weekly.includes(t)))
  check('save path still refreshes server truth (router.refresh after POST)',
    read('src/components/activity/ActivityLogForm.tsx').includes('router.refresh()'))
  check('dead progress-summary path untouched (standing rule; its activity math has zero live callers)',
    read('src/lib/progress-summary.ts').includes('/ loggedDays') &&
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')"))
}

// ── 14. QA corrections: date isolation + grants ──────────────────────
console.log('\n14. Date isolation and grants (QA corrections)')
{
  const grants = read('supabase/migrations/016_phase5a3_activity_session_grants.sql')
  // Step date isolation — each selected date is its own form instance.
  check('form remounts per selected date (key={date})',
    page.includes('ActivityLogForm key={date}'))
  check('remount rationale documented at the call site',
    page.includes('never re-runs') || page.includes('own form instance'))
  // RETARGETED (5A.4): steps became nullable, so the initializer now
  // distinguishes a stored NULL (blank field) from a stored 0 ("0") —
  // the property protected here (state comes from the selected date's
  // server row) is unchanged.
  check('form state initializes from the selected date\'s server row',
    stepsForm.includes("existingLog && existingLog.steps !== null ? String(existingLog.steps) : ''"))
  check('save writes the SELECTED date (prop-driven, never a stale one)',
    stepsForm.includes('date,') &&
    stepsRoute.includes("const date = typeof body.date === 'string' && body.date ? body.date : today"))
  check('upsert keys on the requested logged_date',
    serverLib.includes("{ onConflict: 'user_id,logged_date' }") ||
    serverLib.includes('logged_date: date'))
  check('one row per user/day schema contract intact (005)',
    read('supabase/migrations/005_phase1h_activity_logging.sql')
      .includes('UNIQUE (user_id, logged_date)'))
  check('runtime: distinct per-date rows aggregate independently',
    (() => {
      const bounds = { startDate: '2026-08-05', endDate: '2026-08-11' } as any
      const rows = [
        { logged_date: '2026-08-09', steps: 8111 },   // Monday fixture
        { logged_date: '2026-08-10', steps: 12345 },  // yesterday
        { logged_date: '2026-08-11', steps: 17101 },  // today
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.loggedDays === 3 && a.totalSteps === 37557 &&
        a.averageSteps === Math.round(37557 / 7)
    })())
  check('runtime: editing one date changes only that date\'s contribution',
    (() => {
      const bounds = { startDate: '2026-08-05', endDate: '2026-08-11' } as any
      const before = computeWeeklyActivity([
        { logged_date: '2026-08-10', steps: 12345 },
        { logged_date: '2026-08-11', steps: 17101 },
      ], bounds)
      const after = computeWeeklyActivity([
        { logged_date: '2026-08-10', steps: 12345 },
        { logged_date: '2026-08-11', steps: 20000 },
      ], bounds)
      return before.averageSteps === Math.round(29446 / 7) &&
        after.averageSteps === Math.round(32345 / 7)
    })())

  // Grants — the corrective migration and the untouched 015 history.
  check('016 grants exactly the conventional privileges to authenticated',
    grants.includes(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_sessions TO authenticated;'))
  check('nothing granted to anon; no service-role grant (matches convention)',
    !stripSql(grants).includes('anon') && !stripSql(grants).includes('service_role'))
  check('016 contains ONLY the minimal grant + reload notify',
    !stripSql(grants).includes('CREATE') && !stripSql(grants).includes('ALTER TABLE') &&
    !stripSql(grants).includes('POLICY') &&
    grants.includes("NOTIFY pgrst, 'reload schema';"))
  check('applied migration 015 history untouched (RLS + policies intact)',
    migration.includes('ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY') &&
    ['select', 'insert', 'update', 'delete']
      .every((op) => migration.includes(`activity_sessions_${op}_own`)) &&
    !migration.includes('GRANT'))
  check('grant convention matches every working user-owned table',
    ['002_phase1b_food_logging.sql', '003_phase1c_workout_logging.sql',
      '005_phase1h_activity_logging.sql']
      .every((m) => read(`supabase/migrations/${m}`)
        .includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.')))
  check('routes use the cookie-bound authenticated server client (no service role)',
    postRoute.includes("import { createClient } from '@/lib/supabase/server'") &&
    idRoute.includes("import { createClient } from '@/lib/supabase/server'") &&
    !postRoute.includes('service_role') && !idRoute.includes('service_role') &&
    !postRoute.includes('SUPABASE_SERVICE') && !idRoute.includes('SUPABASE_SERVICE'))
  check('unauthenticated requests still rejected before any query (401 on all three verbs)',
    (postRoute.match(/\{ status: 401 \}/g) || []).length === 1 &&
    (idRoute.match(/\{ status: 401 \}/g) || []).length === 2)
  check('own-row scoping unchanged on every write',
    (idRoute.match(/\.eq\('user_id', user\.id\)/g) || []).length >= 3)
  check('both corrections documented with root causes',
    notes.includes('key={date}') &&
    notes.includes('permission denied for table activity_sessions') &&
    notes.includes('016_phase5a3_activity_session_grants.sql'))
  check('weekly-average semantics untouched by these corrections',
    page.includes('averageDailySteps(recentLogs.reduce') &&
    page.includes('>7-day avg</p>'))
  check('passive /api/activity contract untouched by these corrections',
    stepsRoute.includes("Can't log steps for a future date.") &&
    stepsRoute.includes('upsertActivityLogForDate'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
