import { cookies } from 'next/headers'
import {
  TIMEZONE_COOKIE, resolveLocalToday, hourInTimeZone, todayInTimeZone,
} from '@/lib/local-date'

// ============================================================
// ForgeFitOS — Server-side local calendar-date resolution
// Server components and route handlers run on Vercel's UTC clock;
// the user's calendar day/hour must come from the timezone cookie
// LocalDateSync maintains. Cookie-less first requests fall back to
// the UTC day (self-healed client-side on date-navigable pages).
// Kept separate from local-date.ts so client components can import
// the pure helpers without dragging in next/headers.
// ============================================================

/** The user's current calendar day (YYYY-MM-DD). */
function cookieTimeZone(): string | undefined {
  const raw = cookies().get(TIMEZONE_COOKIE)?.value
  if (!raw) return undefined
  try {
    return decodeURIComponent(raw)
  } catch {
    // A malformed cookie must never break a request — every helper
    // below falls back to the UTC day/hour instead.
    return undefined
  }
}

export function localTodayFromCookies(): string {
  return resolveLocalToday(cookieTimeZone())
}

/** The user's current hour of day (0-23); UTC hour when no cookie. */
export function localHourFromCookies(now: Date = new Date()): number {
  const tz = cookieTimeZone()
  return tz ? hourInTimeZone(tz, now) : now.getUTCHours()
}

/** The user's calendar day of an arbitrary instant. */
export function localDayOfInstantFromCookies(instant: Date): string {
  const tz = cookieTimeZone()
  return tz ? todayInTimeZone(tz, instant) : [
    instant.getUTCFullYear(),
    String(instant.getUTCMonth() + 1).padStart(2, '0'),
    String(instant.getUTCDate()).padStart(2, '0'),
  ].join('-')
}
