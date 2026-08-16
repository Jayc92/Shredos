// ============================================================
// ForgeFitOS — Local calendar-date contract (date-boundary fix)
//
// Server components run on Vercel's clock, which is UTC — so any
// "today" derived from new Date() on the server flips to the next
// calendar day at 8pm ET (EDT) / 7pm ET (EST) while the user is
// still living the previous day. The hosted-QA symptom: at 10pm ET
// Saturday the Food/Activity pages opened on UTC-Sunday labeled
// "Today", and Previous showed Saturday instead of Friday.
//
// Contract: a calendar date is a DATE-ONLY string (YYYY-MM-DD) in
// the USER'S local timezone. It never passes through UTC
// serialization (no toISOString on wall-clock instants), and all
// arithmetic on it is pure calendar math that is identical on every
// machine and in every timezone.
//
// The user's IANA timezone arrives via a cookie set client-side
// (LocalDateSync). When the cookie is absent (first-ever request),
// the server falls back to its own day and the client self-heals by
// replacing the URL with the correct local date.
// ============================================================

/** Cookie carrying the browser's IANA timezone name. */
export const TIMEZONE_COOKIE = 'ffos-tz'

/** Calendar day of `now` in UTC (fallback only). */
export function utcDayISO(now: Date = new Date()): string {
  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Calendar day of `now` in the given IANA timezone, as YYYY-MM-DD.
 * en-CA yields the ISO ordering directly. Deterministic for a fixed
 * `now`, regardless of the machine's own timezone. An unknown zone
 * falls back to the UTC day rather than throwing.
 */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  } catch {
    return utcDayISO(now)
  }
}

/**
 * The user's local calendar day: cookie timezone when present,
 * otherwise the server's UTC day (self-healed client-side).
 */
export function resolveLocalToday(
  timeZone: string | undefined,
  now: Date = new Date()
): string {
  return timeZone ? todayInTimeZone(timeZone, now) : utcDayISO(now)
}

/** Strict YYYY-MM-DD validation: shape AND a real calendar date. */
export function isValidDateParam(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const probe = new Date(Date.UTC(y, m - 1, d))
  return probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
}

/**
 * Pure calendar arithmetic on a date-only string. Anchoring the math
 * at UTC noon-free Date.UTC components makes it identical on every
 * machine — the wall clock and local timezone never participate.
 */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Calendar day of an instant using the RUNTIME'S OWN local timezone —
 * for CLIENT components only, where the runtime is the user's
 * browser. Never uses toISOString, so the day cannot shift through
 * UTC serialization.
 */
export function localCalendarDayOf(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/** Hour of day (0-23) of `now` in the given IANA timezone. */
export function hourInTimeZone(timeZone: string, now: Date = new Date()): number {
  try {
    const hour = new Intl.DateTimeFormat('en-GB', {
      timeZone, hour: '2-digit', hourCycle: 'h23',
    }).format(now)
    const parsed = parseInt(hour, 10)
    return Number.isNaN(parsed) ? now.getUTCHours() : parsed
  } catch {
    return now.getUTCHours()
  }
}

/**
 * Monday of the ISO week containing the given calendar date, as
 * YYYY-MM-DD — pure Date.UTC math, identical on every machine.
 */
export function startOfISOWeekISO(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  const probe = new Date(Date.UTC(y, m - 1, d))
  const day = probe.getUTCDay() // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day
  return addDaysISO(dateISO, diffToMonday)
}

// ── Client-side timezone sync decision ─────────────────────────────
//
// The server's FIRST render of any page is unavoidably cookie-less
// (the HTTP request precedes any client JavaScript), so it falls
// back to the UTC day. This pure function decides — once, on
// hydration — how the client repairs that: write/repair the cookie
// and trigger exactly ONE server rerender. Pure and synchronous so
// the harness can prove every branch deterministically.

export interface TimezoneSyncDecision {
  /** IANA zone to (re)write into the cookie; undefined = cookie already correct. */
  cookieValue?: string
  /**
   * 'replace' — date-navigable page rendered a DEFAULTED date that
   *   differs from the browser's local day: replace the URL with an
   *   explicit ?date (the new request rerenders with the fresh
   *   cookie, so no additional refresh is ever needed).
   * 'refresh' — the cookie was missing, malformed, or stale: one
   *   router.refresh() rerenders the current Server Components with
   *   the corrected cookie. The URL (including any explicit
   *   historical ?date) is untouched.
   * 'none' — cookie already matches and no defaulted-date mismatch:
   *   do nothing.
   */
  action: 'replace' | 'refresh' | 'none'
  replaceUrl?: string
}

export function decideTimezoneSync(input: {
  /** Raw ffos-tz cookie value as read from document.cookie (still URL-encoded). */
  rawCookie: string | undefined
  /** Intl.DateTimeFormat().resolvedOptions().timeZone, when available. */
  browserTimeZone: string | undefined
  /** localCalendarDayOf(new Date()) — the browser's local day. */
  browserToday: string
  basePath?: string
  resolvedDate?: string
  hadExplicitDate?: boolean
}): TimezoneSyncDecision {
  const { rawCookie, browserTimeZone, browserToday } = input
  // Without a usable browser zone there is nothing safe to write or
  // refresh toward; the server keeps its documented UTC fallback.
  if (!browserTimeZone) return { action: 'none' }
  let decoded: string | undefined
  if (rawCookie !== undefined) {
    try {
      decoded = decodeURIComponent(rawCookie)
    } catch {
      decoded = undefined // malformed — treat as absent and repair
    }
  }
  const cookieStale = decoded !== browserTimeZone
  const cookieValue = cookieStale ? browserTimeZone : undefined

  const isDateNav = Boolean(input.basePath && input.resolvedDate)
  if (isDateNav && !input.hadExplicitDate && browserToday !== input.resolvedDate) {
    // The replace itself issues a fresh request that rerenders with
    // the just-written cookie — 'refresh' here would be redundant.
    return {
      cookieValue,
      action: 'replace',
      replaceUrl: `${input.basePath}?date=${browserToday}`,
    }
  }
  return { cookieValue, action: cookieStale ? 'refresh' : 'none' }
}

/** Whole days from `fromISO` to `toISO` (positive when to > from). */
export function dayDifferenceISO(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number)
  const [ty, tm, td] = toISO.split('-').map(Number)
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000
  )
}
