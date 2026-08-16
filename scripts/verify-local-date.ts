// ============================================================
// ForgeFitOS — Local calendar-date contract harness
// Proves the repo-wide local-calendar correction: the user's LOCAL
// calendar day (timezone cookie) drives every user-local "today",
// current-week, and current-hour behavior — pages, libs, API-route
// defaults, and client components — never the server's UTC clock —
// and date-only strings never shift through UTC serialization.
// Actual instants (timestamps) intentionally remain UTC.
//
// Every timezone test uses FIXED instants (never the machine's
// current clock or timezone), including the exact hosted-QA window
// where UTC has already rolled to the next day while Eastern Time
// has not.
// Run from the repository root:
//   npx tsx scripts/verify-local-date.ts
// ============================================================

import { readFileSync } from 'fs'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const foodPage = read('src/app/(app)/food/page.tsx')
const activityPage = read('src/app/(app)/activity/page.tsx')
const lib = read('src/lib/local-date.ts')
const libServer = read('src/lib/local-date-server.ts')
const sync = read('src/components/shared/LocalDateSync.tsx')

async function main() {
  const {
    todayInTimeZone, utcDayISO, resolveLocalToday,
    addDaysISO, dayDifferenceISO, isValidDateParam, TIMEZONE_COOKIE,
    hourInTimeZone, startOfISOWeekISO, localCalendarDayOf,
  } = await import('../src/lib/local-date')
  const NY = 'America/New_York'

  // ── 1. Fixed-instant timezone resolution ────────────────────────────
  console.log('\n1. Fixed-instant timezone resolution')
  {
    // The exact hosted-QA window: Saturday Aug 15, 10:00pm EDT ==
    // Sunday Aug 16, 02:00 UTC.
    const qaInstant = new Date('2026-08-16T02:00:00Z')
    check('F1: hosted-QA instant — Eastern day is Saturday Aug 15',
      todayInTimeZone(NY, qaInstant) === '2026-08-15')
    check('F2: same instant — UTC day is already Sunday Aug 16',
      utcDayISO(qaInstant) === '2026-08-16')
    // EDT boundary: local midnight is 04:00 UTC in August.
    check('F3: 03:59:59Z is still Aug 15 in Eastern (11:59:59pm EDT)',
      todayInTimeZone(NY, new Date('2026-08-16T03:59:59Z')) === '2026-08-15')
    check('F4: 04:00:00Z is Aug 16 in Eastern (midnight EDT)',
      todayInTimeZone(NY, new Date('2026-08-16T04:00:00Z')) === '2026-08-16')
    // EST winter boundary: local midnight is 05:00 UTC in January.
    check('F5: 04:59:59Z is Jan 15 in Eastern (11:59:59pm EST)',
      todayInTimeZone(NY, new Date('2026-01-16T04:59:59Z')) === '2026-01-15')
    check('F6: 05:00:00Z is Jan 16 in Eastern (midnight EST)',
      todayInTimeZone(NY, new Date('2026-01-16T05:00:00Z')) === '2026-01-16')
    // Other side of the dateline for symmetry.
    check('F7: Tokyo is already Aug 16 at the QA instant',
      todayInTimeZone('Asia/Tokyo', qaInstant) === '2026-08-16')
    check('F8: unknown timezone falls back to the UTC day, never throws',
      todayInTimeZone('Not/AZone', qaInstant) === '2026-08-16')
    check('F9: resolveLocalToday — cookie present uses it; absent falls back to UTC day',
      resolveLocalToday(NY, qaInstant) === '2026-08-15' &&
      resolveLocalToday(undefined, qaInstant) === '2026-08-16')
  }

  // ── 2. The reported defect scenario, end to end ─────────────────────
  console.log('\n2. Reported defect scenario')
  {
    const qaInstant = new Date('2026-08-16T02:00:00Z')
    const today = resolveLocalToday(NY, qaInstant)
    const initial = today // no ?date param -> default
    check('D1: initial page date is Today / August 15',
      initial === '2026-08-15' && initial === today)
    const prev = addDaysISO(initial, -1)
    check('D2: Previous is Friday, August 14 (not Saturday again)',
      prev === '2026-08-14')
    check('D3: Next from Friday returns to Today / August 15',
      addDaysISO(prev, 1) === '2026-08-15' && addDaysISO(prev, 1) === today)
    const nextFromToday = addDaysISO(initial, 1)
    check('D4: future navigation stays blocked (next > today)',
      nextFromToday === '2026-08-16' && nextFromToday > today)
    check('D5: explicit ?date URLs are stable (valid param wins over today)',
      isValidDateParam('2026-08-14') === true &&
      ('2026-08-14' !== today))
  }

  // ── 3. Pure calendar arithmetic (machine-timezone independent) ──────
  console.log('\n3. Calendar arithmetic')
  {
    check('A1: simple add/subtract', addDaysISO('2026-08-15', 1) === '2026-08-16' &&
      addDaysISO('2026-08-15', -1) === '2026-08-14')
    check('A2: month boundary', addDaysISO('2026-08-31', 1) === '2026-09-01' &&
      addDaysISO('2026-09-01', -1) === '2026-08-31')
    check('A3: year boundary', addDaysISO('2026-01-01', -1) === '2025-12-31' &&
      addDaysISO('2025-12-31', 1) === '2026-01-01')
    check('A4: DST spring-forward day is plain calendar math',
      addDaysISO('2026-03-08', 1) === '2026-03-09' &&
      addDaysISO('2026-03-09', -1) === '2026-03-08')
    check('A5: DST fall-back day too',
      addDaysISO('2026-11-01', 1) === '2026-11-02')
    check('A6: leap day', addDaysISO('2024-02-28', 1) === '2024-02-29' &&
      addDaysISO('2024-02-29', 1) === '2024-03-01')
    check('A7: round trips never shift through UTC serialization',
      ['2026-08-15', '2026-01-01', '2024-02-29', '1999-12-31']
        .every((d) => addDaysISO(addDaysISO(d, 5), -5) === d))
    check('A8: day differences', dayDifferenceISO('2026-08-08', '2026-08-15') === 7 &&
      dayDifferenceISO('2026-08-15', '2026-08-08') === -7 &&
      dayDifferenceISO('2026-08-15', '2026-08-15') === 0)
    check('A9: strict date-param validation',
      isValidDateParam('2026-08-15') &&
      !isValidDateParam('2026-13-01') && !isValidDateParam('2026-02-30') &&
      !isValidDateParam('15-08-2026') && !isValidDateParam('2026-8-15') &&
      !isValidDateParam('2026-08-15T00:00:00Z') && !isValidDateParam(undefined) &&
      !isValidDateParam('javascript:alert(1)'))
  }

  // ── 4. Page wiring (both affected routes) ───────────────────────────
  console.log('\n4. Page wiring')
  {
    for (const [name, src, base] of [
      ['food', foodPage, '/food'], ['activity', activityPage, '/activity'],
    ] as const) {
      // RETARGET (LOCAL-DATE-FIX): original boundary — each page read
      // the cookie inline (`cookies().get(TIMEZONE_COOKIE)?.value` +
      // `resolveLocalToday(tz)`). The repo-wide sweep unified every
      // server consumer onto localTodayFromCookies(), which adds
      // decodeURIComponent with a safe fallback. Same resolution, one
      // shared decode-safe path — the never-the-server-clock property
      // this pin protects is unchanged and still asserted.
      check(`W-${name}: today resolves from the timezone cookie, never the server clock`,
        src.includes('const todayStr = localTodayFromCookies()') &&
        !stripComments(src).includes('todayISO()') &&
        !stripComments(src).includes('cookies()'))
      check(`W-${name}: selected date = validated ?date param, else local today`,
        src.includes('const date = isValidDateParam(searchParams.date) ? searchParams.date : todayStr'))
      check(`W-${name}: nav is pure date-string math (no server-clock isToday/isFuture)`,
        src.includes('const prev = addDaysISO(date, -1)') &&
        src.includes('const next = addDaysISO(date, 1)') &&
        src.includes('const isCurrentToday = date === today') &&
        !stripComments(src).includes('isToday(') &&
        !stripComments(src).includes('isFuture('))
      check(`W-${name}: future navigation blocked by string comparison against local today`,
        /const isNextFuture\s+= next > today/.test(src) &&
        src.includes('aria-disabled={isNextFuture}'))
      check(`W-${name}: LocalDateSync mounted with honest explicit-date flag`,
        src.includes(`<LocalDateSync basePath="${base}" resolvedDate={date} hadExplicitDate={isValidDateParam(searchParams.date)} />`))
      check(`W-${name}: no UTC serialization of wall-clock dates`,
        !stripComments(src).includes('toISOString'))
      check(`W-${name}: Today / Back to today copy preserved`,
        src.includes("? 'Today'") && src.includes('Back to today') &&
        src.includes('aria-label="Previous day"'))
    }
    check('W-shared: 14-day recent-foods window still anchored to (local) today',
      foodPage.includes('const fourteenDaysAgo = addDaysISO(todayStr, -13)') &&
      foodPage.includes('anchored to today'))
    check('W-shared: activity trailing week anchored to (local) today',
      activityPage.includes('const sevenDaysAgo = addDaysISO(todayStr, -6)'))
    check('W-shared: activity future-date guard compares strings against local today',
      activityPage.includes('const isFutureDate = date > todayStr'))
  }

  // ── 5. Client sync contract ─────────────────────────────────────────
  console.log('\n5. Client sync')
  {
    check('C1: cookie carries the IANA zone with sane attributes',
      sync.includes('Intl.DateTimeFormat().resolvedOptions().timeZone') &&
      sync.includes('max-age=31536000') && sync.includes('SameSite=Lax') &&
      sync.includes('path=/'))
    // RETARGET (LOCAL-DATE-FIX): original boundary — the component
    // held the defaulted-AND-differs condition inline. That condition
    // now lives verbatim in the pure decideTimezoneSync 'replace'
    // branch (runtime-proven exhaustively in section 15), and the
    // component navigates only on the decision's verdict. The
    // protected property — replace ONLY when the date was defaulted
    // and differs, explicit ?date never overridden — is unchanged.
    check('C2: self-heal replaces the URL only when the date was defaulted AND differs',
      lib.includes("if (isDateNav && !input.hadExplicitDate && browserToday !== input.resolvedDate)") &&
      sync.includes("decision.action === 'replace' && decision.replaceUrl") &&
      sync.includes('router.replace(decision.replaceUrl)'))
    check('C3: explicit ?date URLs are never overridden',
      sync.indexOf('hadExplicitDate') < sync.indexOf('router.replace'))
    // RETARGET (LOCAL-DATE-FIX): original boundary — the component
    // built the day from inline local getters (`now.getFullYear()`
    // etc.). Those getters moved verbatim into the shared
    // localCalendarDayOf helper (proven directly in section 9) so
    // client components share one implementation. The protected
    // property — local getters, never toISOString — is unchanged.
    check('C4: browser-local day built from local getters, never toISOString',
      sync.includes('localCalendarDayOf(new Date())') &&
      lib.includes('d.getFullYear()') &&
      !sync.includes('toISOString'))
    check('C5: renders nothing and uses no timers',
      sync.includes('return null') && !sync.includes('setTimeout'))
    // RETARGET (LOCAL-DATE-FIX): original boundary — the pin matched
    // the exact single-name import line. The import now also carries
    // localCalendarDayOf (shared browser-day helper); the protected
    // property — one shared cookie-name constant, defined once in the
    // lib — is unchanged and still asserted.
    check('C6: cookie name is the single shared constant',
      sync.includes('TIMEZONE_COOKIE, localCalendarDayOf, decideTimezoneSync,') &&
      lib.includes("export const TIMEZONE_COOKIE = 'ffos-tz'") &&
      !sync.includes("'ffos-tz'"))
  }

  // ── 6. Scope ────────────────────────────────────────────────────────
  console.log('\n6. Scope')
  {
    check('S1: UI-5B1B files and migration 021 untouched by this fix',
      !read('supabase/migrations/021_ui5b_transactional_ordering.sql').includes('LOCAL-DATE') &&
      !read('src/components/workout/WorkoutExerciseBlock.tsx').includes('local-date') &&
      !read('src/components/workout/SetRow.tsx').includes('local-date'))
    check('S2: dates.ts left intact for its other consumers',
      read('src/lib/dates.ts').includes('export function todayISO()'))
  }

  // ── 7. Fixed-instant local hour (Food meal pacing) ──────────────────
  console.log('\n7. Fixed-instant local hour')
  {
    const qaInstant = new Date('2026-08-16T02:00:00Z')
    check('H1: hosted-QA instant is 22:00 in Eastern (10pm Saturday)',
      hourInTimeZone(NY, qaInstant) === 22)
    check('H2: same instant is hour 2 in UTC — the old meal-pacing bug',
      qaInstant.getUTCHours() === 2 && hourInTimeZone(NY, qaInstant) !== qaInstant.getUTCHours())
    check('H3: EDT midnight boundary — 03:59:59Z is hour 23, 04:00:00Z is hour 0',
      hourInTimeZone(NY, new Date('2026-08-16T03:59:59Z')) === 23 &&
      hourInTimeZone(NY, new Date('2026-08-16T04:00:00Z')) === 0)
    check('H4: EST midnight boundary — 04:59:59Z is hour 23, 05:00:00Z is hour 0',
      hourInTimeZone(NY, new Date('2026-01-16T04:59:59Z')) === 23 &&
      hourInTimeZone(NY, new Date('2026-01-16T05:00:00Z')) === 0)
    check('H5: h23 cycle — Eastern noon is 12, Eastern midnight is 0 (never 24)',
      hourInTimeZone(NY, new Date('2026-08-15T16:00:00Z')) === 12)
    check('H6: unknown timezone falls back to the UTC hour, never throws',
      hourInTimeZone('Not/AZone', qaInstant) === 2)
  }

  // ── 8. Fixed-instant ISO week (Fasting + workout week windows) ──────
  console.log('\n8. Fixed-instant ISO week')
  {
    check('K1: Saturday Aug 15 2026 belongs to the week of Monday Aug 10',
      startOfISOWeekISO('2026-08-15') === '2026-08-10')
    check('K2: Sunday belongs to the PREVIOUS Monday (ISO), not the next',
      startOfISOWeekISO('2026-08-16') === '2026-08-10')
    check('K3: Monday is its own week start',
      startOfISOWeekISO('2026-08-10') === '2026-08-10' &&
      startOfISOWeekISO('2026-08-17') === '2026-08-17')
    check('K4: year-boundary week — Thu Jan 1 2026 starts Mon Dec 29 2025',
      startOfISOWeekISO('2026-01-01') === '2025-12-29')
    // The Fasting defect scenario: Sunday Aug 16, 10pm EDT == Monday
    // Aug 17, 02:00 UTC. The user is still inside the week of Aug 10;
    // the old startOfISOWeek(new Date()) on the UTC server had already
    // flipped to the week of Aug 17, silently emptying "this week".
    const fastingInstant = new Date('2026-08-17T02:00:00Z')
    const userWeek = startOfISOWeekISO(todayInTimeZone(NY, fastingInstant))
    const utcWeek  = startOfISOWeekISO(utcDayISO(fastingInstant))
    check('K5: Fasting scenario — user week anchor is Monday Aug 10',
      todayInTimeZone(NY, fastingInstant) === '2026-08-16' && userWeek === '2026-08-10')
    check('K6: same instant on the UTC clock had already flipped to Aug 17',
      utcDayISO(fastingInstant) === '2026-08-17' && utcWeek === '2026-08-17' &&
      userWeek !== utcWeek)
    // date-fns parity: the fasting lib uses startOfISOWeek(parseISO(day))
    // for its boundary INSTANT; the anchor day it receives must produce
    // the same Monday our pure helper computes.
    const { startOfISOWeek, parseISO, format } = await import('date-fns')
    check('K7: date-fns boundary from the corrected anchor lands on the same Monday',
      format(startOfISOWeek(parseISO('2026-08-16')), 'yyyy-MM-dd') === '2026-08-10')
  }

  // ── 9. Browser-local calendar day (client components) ───────────────
  console.log('\n9. Browser-local calendar day')
  {
    // new Date(y, m, d, hh, mm) builds a LOCAL wall-clock instant, so
    // local getters must round-trip it in EVERY machine timezone —
    // while toISOString() would shift it near midnight in any zone
    // east of UTC. This is the exact client-side variant of the bug.
    check('L1: local getters round-trip a local 11:59pm wall-clock',
      localCalendarDayOf(new Date(2026, 7, 15, 23, 59)) === '2026-08-15')
    check('L2: local getters round-trip a local 00:00 wall-clock',
      localCalendarDayOf(new Date(2026, 0, 1, 0, 0)) === '2026-01-01')
    check('L3: single-digit month/day zero-padded',
      localCalendarDayOf(new Date(2026, 2, 5, 12, 0)) === '2026-03-05')
  }

  // ── 10. Server cookie helper ─────────────────────────────────────────
  console.log('\n10. Server cookie helper')
  {
    check('SH1: server-only module — pages/APIs never touch cookies directly',
      libServer.includes("import { cookies } from 'next/headers'") &&
      !lib.includes('next/headers'))
    check('SH2: cookie value is URL-decoded with a safe fallback',
      libServer.includes('decodeURIComponent(raw)') &&
      /catch \{[\s\S]*?return undefined/.test(libServer))
    check('SH3: absent/malformed cookie falls back to the UTC day and hour',
      libServer.includes('resolveLocalToday(cookieTimeZone())') &&
      libServer.includes('now.getUTCHours()'))
    check('SH4: helpers exported for day, hour, and instant-day',
      libServer.includes('export function localTodayFromCookies') &&
      libServer.includes('export function localHourFromCookies') &&
      libServer.includes('export function localDayOfInstantFromCookies'))
  }

  // ── 11. Repo-wide consumer wiring ────────────────────────────────────
  console.log('\n11. Repo-wide consumer wiring')
  {
    const layout = read('src/app/(app)/layout.tsx')
    check('R1: layout mounts LocalDateSync cookie-only for every app page',
      layout.includes('<LocalDateSync />'))
    check('R2: food meal-pacing hour is the user-local hour',
      foodPage.includes('const nowHour = localHourFromCookies()') &&
      !stripComments(foodPage).includes('new Date().getHours()'))
    const workouts = read('src/app/(app)/workouts/page.tsx')
    check('R3: workouts — local today + 7-day volume window',
      workouts.includes('const today = localTodayFromCookies()') &&
      workouts.includes('addDaysISO(today, -7)'))
    const dashboard = read('src/app/(app)/dashboard/page.tsx')
    check('R4: dashboard — local today, local hour, local date label',
      dashboard.includes('const today = localTodayFromCookies()') &&
      dashboard.includes('localHourFromCookies()') &&
      dashboard.includes('const todayLabel = formatDateFull(today)') &&
      !stripComments(dashboard).includes('formatDateFull(new Date())'))
    check('R5: coach page anchors to local today',
      read('src/app/(app)/coach/page.tsx').includes('const today = localTodayFromCookies()'))
    const weighIn = read('src/app/(app)/weigh-in/page.tsx')
    check('R6: weigh-in — local today + server-safe next-weigh-in fallback',
      weighIn.includes('const today = localTodayFromCookies()') &&
      weighIn.includes("lastDate ?? new Date(localTodayFromCookies() + 'T00:00:00')"))
    check('R7: check-in weekly review anchored to local today',
      read('src/app/(app)/check-in/page.tsx').includes('localTodayFromCookies(),'))
    const progress = read('src/app/(app)/progress/page.tsx')
    check('R8: progress — energy trends + chart window anchored to local today',
      progress.includes('const localToday = localTodayFromCookies()') &&
      progress.includes('fetchProgressEnergyTrends(supabase, user.id, localToday, energyRange, target, profile)') &&
      progress.includes('addDaysISO(localToday, -(energyRange * 7))'))
    const nutritionCard = read('src/components/dashboard/NutritionCard.tsx')
    check('R9: NutritionCard (server component) — local today + local hour',
      nutritionCard.includes('localTodayFromCookies()') &&
      nutritionCard.includes('localHourFromCookies()'))
    const weightCard = read('src/components/dashboard/WeightCard.tsx')
    check('R10: WeightCard next-weigh-in fallback is the user-local day',
      weightCard.includes("lastDate ?? new Date(localTodayFromCookies() + 'T00:00:00')"))
    const server = read('src/lib/supabase/server.ts')
    check('R11: fasting week anchors to the user-local day (boundary semantics kept)',
      server.includes('const weekStart = startOfISOWeek(parseISO(localTodayFromCookies()))') &&
      server.includes('.gte(\'started_at\', weekStart.toISOString())'))
    check('R12: workout week stats anchor to the user-local ISO week',
      server.includes('const weekStartISO = startOfISOWeekISO(localTodayFromCookies())'))
    check('R13: current nutrition target resolved against the user-local day',
      server.includes('const today = localTodayFromCookies()'))
    const workoutCoach = read('src/lib/workout-coach.ts')
    check('R14: exercise trends 30-day window — explicit local-day param (client-safe lib)',
      workoutCoach.includes('const thirtyDaysAgo = addDaysISO(todayISO, -30)') &&
      !workoutCoach.includes('next/headers') &&
      read('src/app/(app)/workouts/[id]/page.tsx')
        .includes('fetchExerciseTrends(supabase, user.id, exerciseIds, localTodayFromCookies())'))
  }

  // ── 12. API-route calendar-day contract (page parity) ───────────────
  console.log('\n12. API-route calendar-day contract')
  {
    check('P1: /api/activity future guard uses the user-local today',
      read('src/app/api/activity/route.ts').includes('const today = localTodayFromCookies()'))
    check('P2: day-status guard compares against the user-local today',
      read('src/app/api/nutrition/day-status/route.ts').includes('raw > localTodayFromCookies()'))
    check('P3: goal-adjustment anchors all three reads to the user-local today',
      (read('src/app/api/goal-adjustment/route.ts').match(/localTodayFromCookies\(\)/g) || []).length === 3)
    check('P4: workout POST default date = user-local today (explicit date still wins)',
      read('src/app/api/workouts/route.ts').includes('body.workout_date ?? localTodayFromCookies()'))
    check('P5: routine start default date = user-local today',
      read('src/app/api/routines/[id]/start/route.ts').includes('body.workout_date ?? localTodayFromCookies()'))
    check('P6: food-log default logged_date = user-local today',
      read('src/app/api/food-logs/route.ts').includes('body.logged_date ?? localTodayFromCookies()'))
    check('P7: saved-meal quick-add default date = user-local today',
      read('src/app/api/saved-meals/[id]/quick-add/route.ts').includes('body.date ?? localTodayFromCookies()'))
    for (const f of ['src/app/api/activity-sessions/route.ts', 'src/app/api/activity-sessions/[id]/route.ts']) {
      const src = read(f)
      check(`P8: ${f.includes('[id]') ? 'session PATCH' : 'session POST'} guard — cookie-exact day, documented skew only pre-cookie`,
        src.includes('if (tz) return todayInTimeZone(tz)') &&
        src.includes('d.setUTCDate(d.getUTCDate() + 1)'))
    }
  }

  // ── 13. Client components — no UTC serialization of wall-clock days ─
  console.log('\n13. Client-component local days')
  {
    for (const [name, f, needle] of [
      ['QuickAddPanel', 'src/components/food/QuickAddPanel.tsx',
        "date === localCalendarDayOf(new Date()) ? 'today' : date"],
      ['RecentFoodPanel', 'src/components/food/RecentFoodPanel.tsx',
        "date === localCalendarDayOf(new Date()) ? 'today' : date"],
      ['OnboardingWizard', 'src/components/onboarding/OnboardingWizard.tsx',
        'effective_date: localCalendarDayOf(new Date())'],
    ] as const) {
      check(`Q-${name}: browser-local day via shared helper`, read(f).includes(needle))
    }
    const nutritionPage = read('src/app/(app)/nutrition/page.tsx')
    check('Q-nutrition: both effective-date sites use the browser-local day',
      nutritionPage.includes(".lte('effective_date', localCalendarDayOf(new Date()))") &&
      nutritionPage.includes('const today = localCalendarDayOf(new Date())'))
  }

  // ── 14. Intentional UTC instants preserved ──────────────────────────
  console.log('\n14. Intentional UTC instants preserved')
  {
    check('U1: workout complete stamps a real UTC instant',
      read('src/app/api/workouts/[id]/complete/route.ts').includes('.toISOString()'))
    check('U2: activity-session times remain UTC instants',
      read('src/app/api/activity-sessions/route.ts')
        .includes('started_at: startedAt?.toISOString() ?? null') &&
      read('src/lib/fasting.ts').includes('new Date(endedAt)'))
    check('U3: fasting elapsed math stays instant-based (duration, not calendar)',
      read('src/lib/fasting.ts').includes('const end = endedAt ? new Date(endedAt) : new Date()'))
  }

  // ── 15. Hydration repair (decideTimezoneSync runtime proofs) ────────
  console.log('\n15. Hydration repair')
  {
    const { decideTimezoneSync } = await import('../src/lib/local-date')
    const NYC = 'America/New_York'
    // The rollover window: server rendered cookie-less at Sat 10pm
    // EDT == Sun 02:00 UTC, so its fallback day was 2026-08-16 while
    // the browser's local day is 2026-08-15.
    const rollover = {
      browserToday: '2026-08-15',
      serverFallbackDay: '2026-08-16',
    }

    // Cookie-less first visit to a NON-date-navigable page
    // (Dashboard / Fasting): write the cookie, exactly one refresh.
    for (const label of ['dashboard', 'fasting']) {
      const d = decideTimezoneSync({
        rawCookie: undefined, browserTimeZone: NYC,
        browserToday: rollover.browserToday,
      })
      check(`Y1-${label}: cookie-less first visit in the rollover window — cookie written + one refresh`,
        d.cookieValue === NYC && d.action === 'refresh' && d.replaceUrl === undefined)
    }
    // Matching cookie: zero writes, zero navigation.
    check('Y2: matching cookie — no write, no refresh, no replace',
      (() => {
        const d = decideTimezoneSync({
          rawCookie: encodeURIComponent(NYC), browserTimeZone: NYC,
          browserToday: rollover.browserToday,
        })
        return d.cookieValue === undefined && d.action === 'none'
      })())
    // Stale timezone cookie (genuine browser timezone change): one
    // rewrite and one refresh.
    check('Y3: stale cookie (timezone changed) — one rewrite + one refresh',
      (() => {
        const d = decideTimezoneSync({
          rawCookie: encodeURIComponent('America/Chicago'), browserTimeZone: NYC,
          browserToday: rollover.browserToday,
        })
        return d.cookieValue === NYC && d.action === 'refresh'
      })())
    // Malformed cookie: repaired once, then quiescent.
    check('Y4: malformed cookie — repaired once, second evaluation is quiescent',
      (() => {
        const first = decideTimezoneSync({
          rawCookie: '%E0%A4%A', browserTimeZone: NYC,
          browserToday: rollover.browserToday,
        })
        if (!(first.cookieValue === NYC && first.action === 'refresh')) return false
        const second = decideTimezoneSync({
          rawCookie: encodeURIComponent(first.cookieValue!), browserTimeZone: NYC,
          browserToday: rollover.browserToday,
        })
        return second.cookieValue === undefined && second.action === 'none'
      })())
    // Food/Activity cookie-less first visit with a DEFAULTED date:
    // replace with the explicit local ?date — and never also refresh.
    check('Y5: Food/Activity defaulted-date repair uses replace, not an additional refresh',
      (() => {
        const d = decideTimezoneSync({
          rawCookie: undefined, browserTimeZone: NYC,
          browserToday: rollover.browserToday,
          basePath: '/food', resolvedDate: rollover.serverFallbackDay,
          hadExplicitDate: false,
        })
        return d.action === 'replace' &&
          d.replaceUrl === '/food?date=2026-08-15' &&
          d.cookieValue === NYC
      })())
    // Explicit historical ?date: never replaced; a stale cookie still
    // refreshes (URL — and therefore the historical date — untouched).
    check('Y6: explicit historical date stays stable (stale cookie refreshes in place)',
      (() => {
        const stale = decideTimezoneSync({
          rawCookie: undefined, browserTimeZone: NYC,
          browserToday: rollover.browserToday,
          basePath: '/food', resolvedDate: '2026-08-01', hadExplicitDate: true,
        })
        const matching = decideTimezoneSync({
          rawCookie: encodeURIComponent(NYC), browserTimeZone: NYC,
          browserToday: rollover.browserToday,
          basePath: '/food', resolvedDate: '2026-08-01', hadExplicitDate: true,
        })
        return stale.action === 'refresh' && stale.replaceUrl === undefined &&
          matching.action === 'none'
      })())
    // Loop-freedom, chained end-to-end: apply each decision's cookie
    // write and re-evaluate — every path reaches 'none'.
    check('Y7: every repair path converges to none (no refresh/replace loop)',
      (() => {
        // refresh path (dashboard/fasting)
        let cookie: string | undefined
        const r1 = decideTimezoneSync({ rawCookie: cookie, browserTimeZone: NYC, browserToday: '2026-08-15' })
        if (r1.cookieValue) cookie = encodeURIComponent(r1.cookieValue)
        const r2 = decideTimezoneSync({ rawCookie: cookie, browserTimeZone: NYC, browserToday: '2026-08-15' })
        // replace path (food): after the replace, the URL carries an
        // explicit ?date equal to the browser day.
        let c2: string | undefined
        const p1 = decideTimezoneSync({
          rawCookie: c2, browserTimeZone: NYC, browserToday: '2026-08-15',
          basePath: '/food', resolvedDate: '2026-08-16', hadExplicitDate: false,
        })
        if (p1.cookieValue) c2 = encodeURIComponent(p1.cookieValue)
        const p2 = decideTimezoneSync({
          rawCookie: c2, browserTimeZone: NYC, browserToday: '2026-08-15',
          basePath: '/food', resolvedDate: '2026-08-15', hadExplicitDate: true,
        })
        return r1.action === 'refresh' && r2.action === 'none' &&
          p1.action === 'replace' && p2.action === 'none'
      })())
    // The unavoidable first-render limitation, and its repair: the
    // server's cookie-less render falls back to the UTC day; after
    // the one refresh the same request-time resolution with the
    // now-present cookie yields the user's real day.
    check('Y8: first server render is UTC (unavoidable) and the refreshed render is local',
      (() => {
        const qaInstant = new Date('2026-08-16T02:00:00Z')
        const firstRender = resolveLocalToday(undefined, qaInstant)
        const afterRefresh = resolveLocalToday(NYC, qaInstant)
        return firstRender === '2026-08-16' && afterRefresh === '2026-08-15'
      })())
    // No usable browser zone: nothing is written, nothing navigates —
    // the server's documented UTC fallback simply stands.
    check('Y9: missing browser timezone degrades to no-op',
      (() => {
        const d = decideTimezoneSync({
          rawCookie: undefined, browserTimeZone: undefined, browserToday: '2026-08-15',
        })
        return d.action === 'none' && d.cookieValue === undefined
      })())
    // Component wiring: the decision is the ONLY navigation source,
    // refresh is capped per distinct timezone, and the layout's
    // cookie-only instance stands down when a date-nav instance owns
    // the page's repair.
    check('Y10: component navigates only on the decision verdict',
      sync.includes('const decision = decideTimezoneSync({') &&
      (stripComments(sync).match(/router\.refresh\(\)/g) || []).length === 1 &&
      (stripComments(sync).match(/router\.replace\(/g) || []).length === 1 &&
      sync.includes('router.replace(decision.replaceUrl)'))
    check('Y11: refresh capped per distinct browser timezone (blocked-cookie safe, tz change still heals)',
      sync.includes('lastRepair.current !== browserTimeZone') &&
      sync.includes('lastRepair.current = browserTimeZone ?? null'))
    check('Y12: layout cookie-only instance stands down for the page-owned repair',
      sync.includes('let dateNavInstances = 0') &&
      sync.includes('const standDown = !isDateNav && dateNavInstances > 0') &&
      sync.includes('if (isDateNav) dateNavInstances += 1') &&
      sync.includes('if (isDateNav) dateNavInstances -= 1'))
    check('Y13: cookie write uses the decision value with safe attributes',
      sync.includes('if (decision.cookieValue) {') &&
      sync.includes('encodeURIComponent(decision.cookieValue)') &&
      sync.includes('path=/; max-age=31536000; SameSite=Lax'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
