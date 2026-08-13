// ============================================================
// ForgeFitOS — Phase 5A.4 deterministic verification harness
// Verifies daily aggregate distance: migration 017 (nullable steps
// + canonical daily distance_meters), the authoritative NULL-vs-0
// semantics for BOTH daily metrics, the independently-optional
// steps/distance contract, the informational aggregate-vs-session
// distance reconciliation, dashboard/weekly-review nullable-steps
// handling — and that the aggregate/component boundary holds: no
// automatic summation, no steps/distance conversion, no calorie or
// Coach consumption. Validation, conversion, aggregation, and
// reconciliation logic execute at RUNTIME against the real lib
// helpers.
// Run from the repository root:
//   npx tsx scripts/verify-phase5a4.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  METERS_PER_MILE,
  milesToMeters,
  metersToMiles,
  DAILY_STEPS_MAX,
  DAILY_DISTANCE_MAX_METERS,
  validateDailyMovementInput,
  sessionDistanceTotalMeters,
  dailyDistanceReconciliationWarning,
  validateActivitySessionInput,
} from '../src/lib/activity'
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

const migration017 = read('supabase/migrations/017_phase5a4_daily_activity_distance.sql')
const migration015 = read('supabase/migrations/015_phase5a3_activity_sessions.sql')
const migration016 = read('supabase/migrations/016_phase5a3_activity_session_grants.sql')
const migration005 = read('supabase/migrations/005_phase1h_activity_logging.sql')
const types = read('src/types/database.ts')
const activityLib = read('src/lib/activity.ts')
const stepsRoute = read('src/app/api/activity/route.ts')
const stepsForm = read('src/components/activity/ActivityLogForm.tsx')
const page = read('src/app/(app)/activity/page.tsx')
const serverLib = read('src/lib/supabase/server.ts')
const weekly = read('src/lib/weekly-review.ts')
const stepsCard = read('src/components/dashboard/StepsCard.tsx')
const postRoute = read('src/app/api/activity-sessions/route.ts')
const idRoute = read('src/app/api/activity-sessions/[id]/route.ts')
const checkin = read('src/app/(app)/check-in/page.tsx')
const notes = read('docs/phase5a4-daily-aggregate-distance-notes.md')

const CHANGED = [types, activityLib, stepsRoute, stepsForm, page, serverLib, weekly, stepsCard]

// ── 1. Checkpoint and migration 017 ──────────────────────────────────
console.log('\n1. Checkpoint and migration 017')
{
  check('checkpoint artifacts exist (5dbcd40 tree)',
    ['scripts/verify-phase5a3.ts', 'docs/phase5a3-activity-sessions-notes.md',
      'src/lib/activity.ts', 'src/lib/local-time.ts',
      'supabase/migrations/016_phase5a3_activity_session_grants.sql']
      .every((f) => existsSync(f)))
  check('5A.4 notes exist', notes.length > 1500)
  // RETARGETED (5A.6B): 018 is that approved phase's anatomy
  // migration, so this pin's boundary is now "5A.4 added exactly 017"
  // rather than a total count every later phase would break (the same
  // retarget the 5A.2/5A.3 boundary pins received).
  check('5A.4 migration boundary: added exactly 017 (no duplicates)',
    existsSync('supabase/migrations/017_phase5a4_daily_activity_distance.sql') &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('017')).length === 1)
  check('017 adds canonical distance at the 011/015 precision',
    migration017.includes('ADD COLUMN distance_meters NUMERIC(10,2)'))
  check('017 distance CHECK: NULL allowed, zero allowed, negatives impossible',
    migration017.includes('CHECK (distance_meters IS NULL OR distance_meters >= 0)'))
  check('017 makes steps honestly optional (DROP NOT NULL)',
    migration017.includes('ALTER COLUMN steps DROP NOT NULL'))
  check('017 removes the zero-fabricating default (DROP DEFAULT)',
    migration017.includes('ALTER COLUMN steps DROP DEFAULT'))
  check('017 is additive only — no backfill, no data rewrite, no drops',
    !stripSql(migration017).includes('UPDATE ') &&
    !stripSql(migration017).includes('DELETE ') &&
    !stripSql(migration017).includes('DROP TABLE') &&
    !stripSql(migration017).includes('DROP COLUMN'))
  check('017 adds no GRANT (005 table privileges cover added columns)',
    !stripSql(migration017).includes('GRANT'))
  check('017 touches no RLS or policies',
    !stripSql(migration017).includes('POLICY') &&
    !stripSql(migration017).includes('ROW LEVEL SECURITY'))
  check('017 adds no index',
    !stripSql(migration017).includes('CREATE INDEX'))
  check('017 adds no provenance column yet',
    !stripSql(migration017).includes('source') &&
    !stripSql(migration017).includes('provider'))
  check('017 notifies PostgREST', migration017.includes("NOTIFY pgrst, 'reload schema';"))
  check('017 targets only daily_activity_logs',
    !stripSql(migration017).includes('activity_sessions') &&
    !stripSql(migration017).includes('workout_sessions'))
  check('017 contains no emoji/pictographs', !EMOJI.test(migration017))
}

// ── 2. Applied migrations untouched ──────────────────────────────────
console.log('\n2. Applied migrations untouched')
{
  check('migration 005 untouched (steps CHECK + one-row-per-day contract intact)',
    migration005.includes('steps        INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0 AND steps <= 100000)') &&
    migration005.includes('UNIQUE (user_id, logged_date)') &&
    migration005.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_activity_logs TO authenticated;'))
  check('005 CHECK remains valid under nullable steps (NULL passes SQL CHECK)',
    migration005.includes('CHECK (steps >= 0 AND steps <= 100000)'))
  check('migration 015 untouched (table, RLS, policies)',
    migration015.includes('CREATE TABLE activity_sessions (') &&
    migration015.includes('ENABLE ROW LEVEL SECURITY') &&
    (migration015.match(/CREATE POLICY/g) || []).length === 4)
  check('migration 016 untouched (exact minimal grant)',
    migration016.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_sessions TO authenticated;') &&
    !stripSql(migration016).includes('anon'))
}

// ── 3. Types: NULL-vs-0 survives the type layer ──────────────────────
console.log('\n3. Types')
{
  check('DailyActivityLog.steps is nullable',
    types.includes('steps: number | null'))
  check('DailyActivityLog.distance_meters added, nullable',
    types.includes('distance_meters: number | null'))
  check('NULL-vs-0 semantics documented at the type',
    types.includes('NULL = not recorded') || types.includes('NULL = not recorded, 0 = explicitly recorded'))
  check('ActivitySession type untouched (5A.3 shape)',
    types.includes('activity_date: string') &&
    types.includes('duration_seconds: number'))
}

// ── 4. Runtime: steps validation (NULL vs 0 vs value) ────────────────
console.log('\n4. Runtime: steps validation')
{
  const v = validateDailyMovementInput
  check('runtime: blank steps -> NULL (never fabricated zero)',
    (() => { const r = v({ steps: '' }); return r.ok && r.steps === null })())
  check('runtime: absent steps -> NULL',
    (() => { const r = v({}); return r.ok && r.steps === null })())
  check('runtime: null steps -> NULL',
    (() => { const r = v({ steps: null }); return r.ok && r.steps === null })())
  check('runtime: explicit 0 steps -> 0 (a real recorded zero, not NULL)',
    (() => { const r = v({ steps: 0 }); return r.ok && r.steps === 0 })())
  check('runtime: string "0" steps -> 0',
    (() => { const r = v({ steps: '0' }); return r.ok && r.steps === 0 })())
  check('runtime: positive integer accepted exactly',
    (() => { const r = v({ steps: 17101 }); return r.ok && r.steps === 17101 })())
  check('runtime: string numeric accepted ("8111" -> 8111)',
    (() => { const r = v({ steps: '8111' }); return r.ok && r.steps === 8111 })())
  check('runtime: decimal steps rejected (steps are whole)',
    !v({ steps: 12.5 }).ok)
  check('runtime: negative steps rejected',
    !v({ steps: -1 }).ok)
  check('runtime: malformed steps rejected',
    !v({ steps: 'abc' }).ok)
  check('runtime: NaN steps rejected', !v({ steps: NaN }).ok)
  check('runtime: Infinity steps rejected', !v({ steps: Infinity }).ok)
  check('runtime: established 100000 bound retained (100000 ok, 100001 rejected)',
    (() => {
      const ok = v({ steps: DAILY_STEPS_MAX })
      return ok.ok && ok.steps === 100000 && !v({ steps: 100001 }).ok
    })())
  check('runtime: rejection is explicit, never a silent clamp',
    (() => { const r = v({ steps: 100001 }); return !r.ok && r.error.length > 0 })())
  check('DAILY_STEPS_MAX mirrors the 005 CHECK bound', DAILY_STEPS_MAX === 100000)
}

// ── 5. Runtime: distance validation (NULL vs 0 vs canonical meters) ──
console.log('\n5. Runtime: distance validation')
{
  const v = validateDailyMovementInput
  check('runtime: blank distance -> NULL (not recorded)',
    (() => { const r = v({ distanceMiles: '' }); return r.ok && r.distanceMeters === null })())
  check('runtime: absent distance -> NULL',
    (() => { const r = v({}); return r.ok && r.distanceMeters === null })())
  check('runtime: null distance -> NULL',
    (() => { const r = v({ distanceMiles: null }); return r.ok && r.distanceMeters === null })())
  check('runtime: explicit 0 distance -> 0 meters (a real recorded zero)',
    (() => { const r = v({ distanceMiles: 0 }); return r.ok && r.distanceMeters === 0 })())
  check('runtime: string "0" distance -> 0',
    (() => { const r = v({ distanceMiles: '0' }); return r.ok && r.distanceMeters === 0 })())
  check('runtime: positive miles convert once to canonical meters (7.4 mi)',
    (() => {
      const r = v({ distanceMiles: '7.4' })
      return r.ok && r.distanceMeters === milesToMeters(7.4) &&
        r.distanceMeters === Math.round(7.4 * METERS_PER_MILE * 100) / 100
    })())
  check('runtime: 3.8 mi converts exactly via the shared helper',
    (() => { const r = v({ distanceMiles: 3.8 }); return r.ok && r.distanceMeters === milesToMeters(3.8) })())
  check('runtime: negative distance rejected',
    !v({ distanceMiles: -0.01 }).ok)
  check('runtime: NaN distance rejected', !v({ distanceMiles: NaN }).ok)
  check('runtime: Infinity distance rejected', !v({ distanceMiles: Infinity }).ok)
  check('runtime: -Infinity distance rejected', !v({ distanceMiles: -Infinity }).ok)
  check('runtime: malformed distance rejected', !v({ distanceMiles: '5k' }).ok)
  check('runtime: NO arbitrary product cap — 180 mi (the QA typo case) saves',
    (() => { const r = v({ distanceMiles: 180 }); return r.ok && r.distanceMeters === milesToMeters(180) })())
  check('runtime: 500 mi is valid (the rejected D5 cap does not exist)',
    v({ distanceMiles: 500 }).ok)
  check('runtime: only the NUMERIC(10,2) storage bound rejects',
    (() => {
      const over = v({ distanceMiles: 100000000 }) // ~1.6e11 meters > storage precision
      return !over.ok && DAILY_DISTANCE_MAX_METERS === 99999999.99
    })())
  check('runtime: no silent clamping anywhere (over-storage is an error, not a cap)',
    (() => { const r = v({ distanceMiles: 100000000 }); return !r.ok && r.error.includes('too large') })())
  check('runtime: display converts canonical meters back to miles (2dp round-trip)',
    (() => {
      for (const miles of [0.25, 1.74, 3, 4.74, 7.4, 26.2, 180]) {
        if (metersToMiles(milesToMeters(miles)) !== miles) return false
      }
      return true
    })())
  check('one conversion constant only (no second METERS_PER_MILE literal)',
    (activityLib.match(/1609\.34/g) || []).length === 1 &&
    !stepsRoute.includes('1609') && !stepsForm.includes('1609') && !page.includes('1609'))
}

// ── 6. Runtime: independence of the two metrics ───────────────────────
console.log('\n6. Runtime: steps/distance independence')
{
  const v = validateDailyMovementInput
  check('runtime: steps-only day valid (distance stays NULL)',
    (() => { const r = v({ steps: 17101 }); return r.ok && r.steps === 17101 && r.distanceMeters === null })())
  check('runtime: distance-only day valid (steps stay NULL — never fabricated 0)',
    (() => { const r = v({ distanceMiles: '5.2' }); return r.ok && r.steps === null && r.distanceMeters === milesToMeters(5.2) })())
  check('runtime: both valid together',
    (() => { const r = v({ steps: 8111, distanceMiles: 3.8 }); return r.ok && r.steps === 8111 && r.distanceMeters === milesToMeters(3.8) })())
  check('runtime: zero steps + positive distance valid',
    (() => { const r = v({ steps: 0, distanceMiles: 2.5 }); return r.ok && r.steps === 0 && r.distanceMeters === milesToMeters(2.5) })())
  check('runtime: positive steps + zero distance valid',
    (() => { const r = v({ steps: 12345, distanceMiles: 0 }); return r.ok && r.steps === 12345 && r.distanceMeters === 0 })())
  check('runtime: neither recorded is a valid payload (both NULL)',
    (() => { const r = v({}); return r.ok && r.steps === null && r.distanceMeters === null })())
  check('runtime: one bad metric rejects the payload without mutating the other',
    !v({ steps: 5000, distanceMiles: -1 }).ok && !v({ steps: -5, distanceMiles: 1 }).ok)
  check('no distance->steps conversion exists anywhere in scope',
    CHANGED.every((f) => !/stride|stepsFromDistance|stepsPerMile/i.test(stripComments(f))))
  check('no steps->distance conversion exists anywhere in scope',
    CHANGED.every((f) => !/distanceFromSteps|milesFromSteps|estimateDistance/i.test(stripComments(f))))
  check('validator never reads one metric to compute the other',
    (() => {
      const a = v({ steps: 20000 })
      const b = v({ distanceMiles: 9.9 })
      return a.ok && a.distanceMeters === null && b.ok && b.steps === null
    })())
}

// ── 7. Runtime: reconciliation warning ────────────────────────────────
console.log('\n7. Runtime: aggregate-vs-session reconciliation')
{
  const warn = dailyDistanceReconciliationWarning
  const total = sessionDistanceTotalMeters
  check("runtime: user's no-warning fixture — daily 7.4 vs sessions 1.74 + 3.00",
    (() => {
      const sessions = [
        { distance_meters: milesToMeters(1.74) },
        { distance_meters: milesToMeters(3.0) },
      ]
      return warn(milesToMeters(7.4), total(sessions)) === null
    })())
  check("runtime: user's warning fixture — daily 4.5 vs sessions 6.2",
    (() => {
      const w = warn(milesToMeters(4.5), milesToMeters(6.2))
      return w !== null && w.includes('6.2 mi') && w.includes('4.5 mi')
    })())
  check('runtime: warning copy names both totals and asks the user to check',
    (() => {
      const w = warn(milesToMeters(4.5), milesToMeters(6.2))
      return w !== null &&
        w.includes('Your logged activities total') &&
        w.includes('daily movement total') &&
        w.includes('Check your activity total or session distances.')
    })())
  check('runtime: daily NULL -> no warning (nothing to reconcile against)',
    warn(null, milesToMeters(6.2)) === null)
  check('runtime: session NULL distances contribute nothing',
    (() => {
      const sessions = [
        { distance_meters: null },
        { distance_meters: milesToMeters(2.0) },
        { distance_meters: null },
      ]
      return total(sessions) === milesToMeters(2.0)
    })())
  check('runtime: all-NULL sessions total 0 and never warn against a recorded daily',
    (() => {
      const t = total([{ distance_meters: null }, { distance_meters: null }])
      return t === 0 && warn(milesToMeters(3.0), t) === null
    })())
  check('runtime: no sessions -> total 0 -> no warning',
    total([]) === 0 && warn(milesToMeters(1.0), 0) === null)
  check('runtime: equality -> no warning (component may fully account for the aggregate)',
    warn(milesToMeters(4.74), milesToMeters(4.74)) === null)
  check('runtime: comparison happens on 2dp miles (meter noise cannot warn)',
    (() => {
      // 4.74 mi = 7628.27 m canonical; a few raw centimeters of session
      // meter noise still rounds to the same 2dp miles -> no warning.
      const daily = milesToMeters(4.74)
      return warn(daily, daily + 0.004) === null
    })())
  check('runtime: a real 2dp-mile excess DOES warn',
    warn(milesToMeters(4.74), milesToMeters(4.75)) !== null)
  check('runtime: sessions exceeding an explicit-zero daily total warn',
    warn(0, milesToMeters(1.74)) !== null)
  check('runtime: zero daily + zero sessions -> no warning',
    warn(0, 0) === null)
  check('runtime: warning is a string, never a thrown block',
    (() => {
      const w = warn(milesToMeters(4.5), milesToMeters(6.2))
      return typeof w === 'string'
    })())
  check('runtime: helper is pure — inputs are never mutated',
    (() => {
      const sessions = [{ distance_meters: 1000 }]
      const before = JSON.stringify(sessions)
      total(sessions)
      warn(500, 1000)
      return JSON.stringify(sessions) === before
    })())
}

// ── 8. Warning is informational only (never blocks, never mutates) ───
console.log('\n8. Warning behavior in the product')
{
  check('warning renders on /activity for the viewed date',
    page.includes('dailyDistanceReconciliationWarning(') &&
    page.includes('distanceWarning && ('))
  check('warning compares the viewed date, not a recent-N inference',
    page.includes('fetchActivitySessionsForDate(supabase, user.id, date)'))
  check('per-date session read is scoped by user AND activity_date',
    serverLib.includes("fetchActivitySessionsForDate") &&
    serverLib.includes(".eq('activity_date', date)") &&
    (serverLib.match(/\.eq\('user_id', userId\)/g) || []).length >= 3)
  check('per-date read projects distance only (no over-fetch)',
    serverLib.includes(".select('distance_meters')"))
  check('per-date read adds no new index requirement (existing user/date index)',
    !migration017.includes('INDEX'))
  check('the save path never sees the warning (not save-blocking)',
    !stepsRoute.includes('dailyDistanceReconciliationWarning') &&
    !stepsRoute.includes('sessionDistanceTotalMeters') &&
    !stepsForm.includes('dailyDistanceReconciliationWarning'))
  check('session routes never see the warning either',
    !postRoute.includes('Reconciliation') && !postRoute.includes('dailyDistance') &&
    !idRoute.includes('dailyDistance'))
  check('warning path performs zero writes (page is read-only)',
    !page.includes('.upsert(') && !page.includes('.update(') &&
    !page.includes('.insert(') && !page.includes('.delete('))
  check('warning never auto-fills or mutates either value',
    !stripComments(activityLib).includes('autoFill') &&
    !page.includes('distance_meters:') &&
    !stripComments(page).includes('reconcile('))
  check('warning styling is informational, not alarm (no critical tokens)',
    page.includes('text-ink-muted bg-surface-sunken') &&
    !page.includes('text-critical'))
}

// ── 9. API contract ───────────────────────────────────────────────────
console.log('\n9. /api/activity contract')
{
  check('route validates through the shared pure validator',
    stepsRoute.includes('validateDailyMovementInput({') &&
    stepsRoute.includes('steps: body.steps,') &&
    stepsRoute.includes('distanceMiles: body.distanceMiles,'))
  check('validation failure returns 400 with the exact error',
    stepsRoute.includes('{ error: validation.error }, { status: 400 }'))
  check('the old blank->0 coercion is gone from the route',
    !stepsRoute.includes('if (!Number.isFinite(steps)) steps = 0') &&
    !stepsRoute.includes('Math.max(0, Math.min(100000'))
  check('server passes validated NULL-or-value through to the upsert',
    stepsRoute.includes('validation.steps,') &&
    stepsRoute.includes('validation.distanceMeters,'))
  check('future-date rule unchanged (exact copy)',
    stepsRoute.includes("Can't log steps for a future date.") &&
    stepsRoute.includes('if (date > today) {'))
  check('date defaulting unchanged',
    stepsRoute.includes("const date = typeof body.date === 'string' && body.date ? body.date : today"))
  check('auth gate unchanged (401)',
    stepsRoute.includes("{ error: 'Unauthorized' }, { status: 401 }"))
  check('route still owns ALL daily_activity_logs writes (no second endpoint)',
    !existsSync('src/app/api/activity/distance') &&
    !existsSync('src/app/api/daily-movement') &&
    readdirSync('src/app/api').every((d) => d !== 'daily-distance'))
  check('miles->meters conversion happens exactly once, server-side',
    !stepsForm.includes('milesToMeters') &&
    activityLib.includes('distanceMeters = milesToMeters(miles)'))
  check('upsert writes both metrics independently',
    serverLib.includes('steps: number | null') &&
    serverLib.includes('distanceMeters: number | null') &&
    serverLib.includes('distance_meters: distanceMeters,'))
  check('upsert still keys on user/day (one aggregate row per date)',
    serverLib.includes("{ onConflict: 'user_id,logged_date' }"))
  check('route contains no emoji/pictographs', !EMOJI.test(stepsRoute))
}

// ── 10. Daily movement form ───────────────────────────────────────────
console.log('\n10. Daily movement form')
{
  check('form keeps the 5A.3 per-date remount fix (key={date})',
    page.includes('<ActivityLogForm key={date} date={date} existingLog={existingLog} isFutureDate={isFutureDate} />'))
  check('steps prefill distinguishes NULL (blank) from stored 0 ("0")',
    stepsForm.includes("existingLog && existingLog.steps !== null ? String(existingLog.steps) : ''"))
  check('distance prefills from canonical meters via the shared 2dp helper',
    stepsForm.includes('existingLog && existingLog.distance_meters !== null') &&
    stepsForm.includes('String(metersToMiles(existingLog.distance_meters))'))
  check('blank steps submit as null — never 0',
    stepsForm.includes("steps: steps === '' ? null : Number(steps),"))
  check('blank distance submits as null — never 0',
    stepsForm.includes("distanceMiles: distanceMiles === '' ? null : distanceMiles,"))
  check('both fields are visibly optional',
    stepsForm.includes('Steps (optional)') &&
    stepsForm.includes('Distance (miles, optional)'))
  check('placeholders read "Not recorded" (blank no longer means 0)',
    (stepsForm.match(/placeholder="Not recorded"/g) || []).length === 2 &&
    !stepsForm.includes('placeholder="0"'))
  check('distance input is decimal-friendly (step 0.01, min 0)',
    stepsForm.includes('inputMode="decimal"') &&
    stepsForm.includes('step={0.01}'))
  check('steps input keeps whole-number affordances and the 100000 bound',
    stepsForm.includes('inputMode="numeric"') &&
    stepsForm.includes('max={100000}'))
  check('future dates still disable both inputs',
    (stepsForm.match(/disabled=\{isFutureDate\}/g) || []).length >= 3)
  check('save posts to the one passive endpoint',
    stepsForm.includes("fetch('/api/activity'"))
  check('form performs no client-side conversion or validation shortcuts',
    !stepsForm.includes('milesToMeters') && !stepsForm.includes('validateDailyMovementInput'))
  check('form has no emoji/pictographs', !EMOJI.test(stepsForm))
}

// ── 11. No cross-date state bleed (regression guard) ─────────────────
console.log('\n11. Date isolation regression guard')
{
  check('remount comment still documents the empirically-proven defect',
    page.includes('key={date}: each calendar day gets its OWN form instance'))
  check('both new fields initialize inside the keyed component (remount resets them)',
    (() => {
      const stateBlock = stepsForm.slice(
        stepsForm.indexOf('const [steps'),
        stepsForm.indexOf('async function handleSave'))
      return stateBlock.includes('useState(') &&
        stateBlock.includes('distanceMiles') &&
        stateBlock.includes('existingLog')
    })())
  check('runtime: per-date rows keep independent values (Mon 8111+3.8mi, Tue distance-only, Wed steps-only)',
    (() => {
      const rows = [
        { logged_date: '2026-08-10', steps: 8111, distance_meters: milesToMeters(3.8) },
        { logged_date: '2026-08-11', steps: null, distance_meters: milesToMeters(5.2) },
        { logged_date: '2026-08-12', steps: 17101, distance_meters: null },
      ]
      const stepDays = rows.filter((r) => r.steps !== null)
      const total = rows.reduce((s, r) => s + (r.steps ?? 0), 0)
      return stepDays.length === 2 && total === 25212 &&
        averageDailySteps(total) === Math.round(25212 / 7)
    })())
  check('save body is prop-date-driven (never a stale captured date)',
    stepsForm.includes('date,') &&
    stepsForm.includes('{ date, existingLog, isFutureDate }: ActivityLogFormProps'))
}

// ── 12. Weekly step semantics under nullable steps ────────────────────
console.log('\n12. Weekly step semantics')
{
  check('STEP_WEEK_DAYS remains 7 (SUM/7 rule unchanged)', STEP_WEEK_DAYS === 7)
  check('runtime: authoritative 5A.3 fixture still exact (56000/7 = 8000)',
    averageDailySteps(56000) === 8000)
  check('runtime: correction fixture still exact (62000/7 -> 8857)',
    averageDailySteps(62000) === 8857)
  check('runtime: NULL steps contribute zero to the average',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-10', steps: 8111 },
        { logged_date: '2026-08-11', steps: null },   // distance-only day
        { logged_date: '2026-08-12', steps: 17101 },
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.totalSteps === 25212 && a.averageSteps === Math.round(25212 / 7)
    })())
  check('runtime: a distance-only day does NOT increment step-logged completeness',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-10', steps: 8111 },
        { logged_date: '2026-08-11', steps: null },
      ]
      return computeWeeklyActivity(rows, bounds).loggedDays === 1
    })())
  check('runtime: an explicit 0-step day DOES count as a logged day',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-10', steps: 0 },
        { logged_date: '2026-08-11', steps: 14000 },
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.loggedDays === 2 && a.averageSteps === Math.round(14000 / 7)
    })())
  check('runtime: all-NULL week reads honestly empty (no fake zero average)',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [{ logged_date: '2026-08-10', steps: null }]
      const a = computeWeeklyActivity(rows, bounds)
      return a.loggedDays === 0 && a.averageSteps === null && a.totalSteps === null
    })())
  check('/activity: logged-days counts step-recorded days only',
    page.includes('recentLogs.filter((l) => l.steps !== null).length'))
  check('/activity: sum is NULL-safe through the shared helper',
    page.includes('averageDailySteps(recentLogs.reduce((s, l) => s + (l.steps ?? 0), 0))'))
  check('/activity: goal days require recorded steps (null >= goal coercion impossible)',
    page.includes('l.steps !== null && l.steps >= stepGoal'))
  check('legacy weekly consumer: stepLoggedDays counts non-null only',
    weekly.includes("activityLogs.filter((l) => l.steps !== null).length"))
  check('legacy weekly consumer: NULL-safe sum via the shared helper',
    weekly.includes('activityLogs.reduce((s, l) => s + (l.steps ?? 0), 0)'))
  check('legacy weekly consumer: goal-hit days require recorded steps',
    weekly.includes('l.steps !== null && l.steps >= stepGoal'))
  check('no logged-days division regression anywhere',
    !weekly.includes('/ stepLoggedDays') && !weekly.includes('/ loggedDays') &&
    !page.includes('/ loggedDays'))
  check('unified reviewer row type acknowledges nullable steps',
    weekly.includes('steps: number | null'))
  check('check-in activity card untouched this phase',
    checkin.includes('average daily steps this week') &&
    checkin.includes('of 7 days logged'))
}

// ── 13. Dashboard StepsCard ───────────────────────────────────────────
console.log('\n13. Dashboard StepsCard')
{
  check('hasLoggedToday keys on the steps VALUE, not row existence',
    stepsCard.includes('todayLog?.steps != null') &&
    !stripComments(stepsCard).includes('todayLog !== null'))
  check('distance-only row shows the empty state, never a fake 0',
    stepsCard.includes('No steps logged yet today.'))
  check('explicit 0 steps still renders as a real recorded zero',
    stepsCard.includes('todayLog?.steps ?? 0') &&
    stepsCard.includes('{steps.toLocaleString()}'))
  check('dashboard gained no daily distance this phase (deferred)',
    !/distance|miles|\bmi\b/i.test(stripComments(stepsCard)))
  check('card links to /activity unchanged',
    stepsCard.includes('href="/activity"'))
}

// ── 14. Aggregate/component boundary ─────────────────────────────────
console.log('\n14. Aggregate/component boundary')
{
  check('session routes never touch the daily aggregate table',
    !stripComments(postRoute).includes('daily_activity_logs') &&
    !stripComments(idRoute).includes('daily_activity_logs'))
  check('daily aggregate route never touches sessions',
    !stripComments(stepsRoute).includes('activity_sessions'))
  check('no automatic summation of session distance onto the daily total',
    !page.includes('+ sessionDistanceTotalMeters') &&
    !stripComments(serverLib).includes('+ session') &&
    !activityLib.includes('dailyDistanceMeters + sessionDistanceMeters'))
  check('reconciliation reads, compares, and reports — nothing else',
    (() => {
      const fn = activityLib.slice(
        activityLib.indexOf('export function dailyDistanceReconciliationWarning'),
        activityLib.indexOf('// ── Display formatting'))
      return fn.includes('return null') && fn.includes('return `') &&
        !fn.includes('await') && !fn.includes('supabase')
    })())
  check('session calories remain unintegrated (no nutrition/energy writes)',
    CHANGED.every((f) => !/eat.?back|net calorie|calorie credit|active energy/i
      .test(stripComments(f))))
  check('no Coach or weekly-review consumption of daily distance',
    // (workout_sets.distance_meters in the training query is the
    // pre-existing 011 set-tracking column, not daily distance)
    !read('src/lib/nutrition-coach.ts').includes('distance') &&
    !read('src/lib/coach-actions.ts').includes('distance_meters') &&
    (weekly.match(/\.select\('logged_date, steps'\)/g) || []).length === 2)
  check('no 7-day distance aggregates shipped (deferred by approval)',
    !page.includes('avgDistance') && !page.includes('distanceTotal7') &&
    !weekly.includes('averageDailyDistance') &&
    !checkin.toLowerCase().includes('distance'))
  check('no distance Progress facts (progress-summary byte-untouched rule)',
    !read('src/lib/progress-summary.ts').includes('distance_meters'))
  check('session validator still requires POSITIVE distance (>0) — daily allows 0',
    (() => {
      const session = validateActivitySessionInput(
        { activityType: 'walk', activityDate: '2026-08-10', durationMinutes: 30, distanceMiles: 0 },
        '2026-08-12')
      const daily = validateDailyMovementInput({ distanceMiles: 0 })
      return !session.ok && daily.ok && daily.distanceMeters === 0
    })())
  check('5A.3 session product semantics untouched (validator fixture)',
    (() => {
      const r = validateActivitySessionInput(
        { activityType: 'run', activityDate: '2026-08-10', durationMinutes: 42,
          distanceMiles: '3.00', caloriesBurned: 0, notes: ' tempo ' },
        '2026-08-12')
      return r.ok && r.durationSeconds === 2520 &&
        r.distanceMeters === milesToMeters(3) &&
        r.caloriesBurned === 0 && r.notes === 'tempo'
    })())
}

// ── 15. Scope, hygiene, and docs ──────────────────────────────────────
console.log('\n15. Scope, hygiene, and docs')
{
  check('feature scope: exactly the 8 approved files carry 5A.4 markers',
    ['src/types/database.ts', 'src/lib/activity.ts', 'src/app/api/activity/route.ts',
      'src/lib/supabase/server.ts', 'src/components/activity/ActivityLogForm.tsx',
      'src/app/(app)/activity/page.tsx', 'src/lib/weekly-review.ts',
      'src/components/dashboard/StepsCard.tsx']
      .every((f) => read(f).includes('5A.4')))
  check('no new page routes or endpoints were added',
    !existsSync('src/app/(app)/distance') &&
    !existsSync('src/app/api/activity-distance'))
  check('notes document NULL-vs-0 for both metrics',
    notes.includes('NULL = not recorded') && notes.includes('0 = explicitly'))
  check('notes document nullable-steps rationale',
    notes.includes('DROP NOT NULL') || notes.includes('nullable'))
  check('notes document the reconciliation rule and its never-block stance',
    notes.includes('informational') &&
    (notes.includes('never blocks') || notes.includes('not save-blocking')))
  check('notes record no-hard-cap (D5 as modified)',
    notes.includes('no arbitrary') || notes.includes('No arbitrary'))
  check('notes record the future Health/active-energy model',
    notes.includes('active energy') && notes.includes('850'))
  check('notes record the deferred plausibility warning',
    notes.includes('plausibility'))
  check('notes record the migration stop protocol',
    notes.includes('ttybyljytiwntvorugcv'))
  check('notes flag every retarget',
    notes.includes('RETARGET') || notes.includes('retarget'))
  check('no emoji/pictographs in any changed file',
    CHANGED.every((f) => !EMOJI.test(f)) && !EMOJI.test(migration017) && !EMOJI.test(notes))
  check('no legacy brand violations in changed files',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('changed files carry no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 16. Runtime: hostile input + aggregation edge coverage ───────────
console.log('\n16. Runtime: hostile input + aggregation edges')
{
  const v = validateDailyMovementInput
  check('runtime: whitespace-only steps -> NULL (Number(" ")===0 cannot fabricate a zero)',
    (() => { const r = v({ steps: '   ' }); return r.ok && r.steps === null })())
  check('runtime: whitespace-only distance -> NULL',
    (() => { const r = v({ distanceMiles: '  ' }); return r.ok && r.distanceMeters === null })())
  check('runtime: boolean steps rejected (Number(true)===1 must not pass)',
    !v({ steps: true }).ok && !v({ steps: false }).ok)
  check('runtime: array/object steps rejected (Number([])===0 must not pass)',
    !v({ steps: [] as unknown }).ok && !v({ steps: {} as unknown }).ok)
  check('runtime: boolean/array distance rejected',
    !v({ distanceMiles: true }).ok && !v({ distanceMiles: [] as unknown }).ok)
  check('runtime: exponent-notation steps resolve deterministically ("1e3" -> 1000)',
    (() => { const r = v({ steps: '1e3' }); return r.ok && r.steps === 1000 })())
  check('runtime: decimal-string steps rejected ("12.5")',
    !v({ steps: '12.5' }).ok)
  check('runtime: negative-string distance rejected ("-3")',
    !v({ distanceMiles: '-3' }).ok)
  check('runtime: distance precision survives storage bound exactly (62137.11 mi ok)',
    (() => {
      // 62137.11 mi ≈ 99,999,935 m — inside NUMERIC(10,2); one more
      // order of magnitude is out.
      const ok = v({ distanceMiles: 62137.11 })
      return ok.ok && ok.distanceMeters !== null && ok.distanceMeters <= DAILY_DISTANCE_MAX_METERS
    })())
  check('runtime: METERS_PER_MILE anchors both directions (1 mi <-> 1609.34 m)',
    milesToMeters(1) === 1609.34 && metersToMiles(1609.34) === 1)
  check('runtime: computeWeeklyActivity dedupes same-date rows (first wins, once)',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-10', steps: 8000 },
        { logged_date: '2026-08-10', steps: 9999 },
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.loggedDays === 1 && a.totalSteps === 8000
    })())
  check('runtime: computeWeeklyActivity excludes out-of-window rows',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-05', steps: 5000 },
        { logged_date: '2026-08-13', steps: 5000 },
        { logged_date: '2026-08-12', steps: 7000 },
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.loggedDays === 1 && a.totalSteps === 7000
    })())
  check('runtime: computeWeeklyActivity skips negative/invalid step rows',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-10', steps: -100 },
        { logged_date: '2026-08-11', steps: 7000 },
      ]
      const a = computeWeeklyActivity(rows, bounds)
      return a.loggedDays === 1 && a.totalSteps === 7000
    })())
  check('runtime: inclusive window boundaries (start and end dates count)',
    (() => {
      const bounds = { startDate: '2026-08-06', endDate: '2026-08-12' } as any
      const rows = [
        { logged_date: '2026-08-06', steps: 1000 },
        { logged_date: '2026-08-12', steps: 2000 },
      ]
      return computeWeeklyActivity(rows, bounds).totalSteps === 3000
    })())
  check('runtime: session totals accumulate across many sessions exactly',
    (() => {
      const sessions = [1.74, 3.0, 0.5, 2.2].map((mi) => ({ distance_meters: milesToMeters(mi) }))
      const totalMi = metersToMiles(sessionDistanceTotalMeters(sessions))
      return totalMi === 7.44
    })())
  check('runtime: reconciliation catches the accumulated-session case (7.44 vs daily 7.4)',
    dailyDistanceReconciliationWarning(
      milesToMeters(7.4),
      sessionDistanceTotalMeters([1.74, 3.0, 0.5, 2.2].map((mi) => ({ distance_meters: milesToMeters(mi) })))
    ) !== null)
  check('runtime: warning values render at 2dp miles (no float tails in copy)',
    (() => {
      const w = dailyDistanceReconciliationWarning(milesToMeters(4.5), milesToMeters(6.2))
      return w !== null && !/\d\.\d{3,}/.test(w)
    })())
  check('route: notes handling unchanged (trimmed presence check, null otherwise)',
    stepsRoute.includes("typeof body.notes === 'string' && body.notes.trim() !== ''"))
  check('route: 500 fallback retained for storage failures',
    stepsRoute.includes('{ status: 500 }'))
  check('StepsCard: goal math unchanged (pct/remaining/goalMet expressions)',
    stepsCard.includes('Math.min(100, Math.round((steps / stepGoal) * 100))') &&
    stepsCard.includes('Math.max(0, stepGoal - steps)') &&
    stepsCard.includes('steps >= stepGoal'))
  check('validator result shape is exact (no extra fields leak to the upsert)',
    (() => {
      const r = v({ steps: 100, distanceMiles: 1 })
      return r.ok && Object.keys(r).sort().join(',') === 'distanceMeters,ok,steps'
    })())
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
