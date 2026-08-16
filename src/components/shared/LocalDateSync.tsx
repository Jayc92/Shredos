'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  TIMEZONE_COOKIE, localCalendarDayOf, decideTimezoneSync,
} from '@/lib/local-date'

// ============================================================
// ForgeFitOS — Local calendar-date sync (date-boundary fix)
// Renders nothing. Two jobs:
//   1. Persist the browser's IANA timezone in a cookie so the SERVER
//      can resolve the user's local calendar day on every subsequent
//      request (server components otherwise live on UTC).
//   2. Repair the CURRENT render: the server's first render of any
//      page is unavoidably cookie-less (the HTTP request precedes
//      any client JS) and falls back to the UTC day. On hydration,
//      decideTimezoneSync (pure, harness-proven) picks exactly one
//      of: replace the URL with the explicit local ?date (date-
//      navigable pages that DEFAULTED their date), one
//      router.refresh() (missing/malformed/stale cookie anywhere
//      else — also how a genuine browser-timezone change self-heals),
//      or nothing (cookie already matches). Explicit ?date URLs are
//      never overridden, and refresh preserves them.
//
// Loop-freedom: a replace lands on an explicit-?date URL (the
// replace branch can never fire again) and a refresh reruns the
// decision against the just-written cookie (which now matches, so
// the result is 'none'). refresh() itself never re-triggers this
// effect (its deps are stable across a refresh), and the lastRepair
// ref additionally guarantees at most ONE refresh per distinct
// browser timezone even if cookie writes are blocked — while still
// allowing a later GENUINE timezone change to refresh exactly once
// more.
// ============================================================

// Date-navigable pages mount their own instance with props; the app
// layout mounts a cookie-only instance with none. When both are on
// screen the DATE-NAV instance owns navigation (child effects run
// before parent effects in React, so it registers here first) and
// the layout instance stands down — one repair, never two.
let dateNavInstances = 0

export function LocalDateSync({
  basePath,
  resolvedDate,
  hadExplicitDate,
}: {
  /** Omit all three to run in cookie-only mode (app layout). */
  basePath?: string
  resolvedDate?: string
  hadExplicitDate?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const lastRepair = useRef<string | null>(null)
  const isDateNav = Boolean(basePath && resolvedDate)

  useEffect(() => {
    if (isDateNav) dateNavInstances += 1

    let browserTimeZone: string | undefined
    try {
      browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      browserTimeZone = undefined
    }
    const rawCookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${TIMEZONE_COOKIE}=`))
      ?.slice(TIMEZONE_COOKIE.length + 1)

    const decision = decideTimezoneSync({
      rawCookie,
      browserTimeZone,
      browserToday: localCalendarDayOf(new Date()),
      basePath,
      resolvedDate,
      hadExplicitDate,
    })

    if (decision.cookieValue) {
      try {
        document.cookie =
          `${TIMEZONE_COOKIE}=${encodeURIComponent(decision.cookieValue)}; path=/; max-age=31536000; SameSite=Lax`
      } catch {
        // Cookie persistence is best-effort; didSync still caps the
        // repair below at one navigation.
      }
    }

    // The layout's cookie-only instance must not refresh when a
    // date-nav instance is handling this page's repair.
    const standDown = !isDateNav && dateNavInstances > 0

    if (!standDown) {
      if (decision.action === 'replace' && decision.replaceUrl) {
        // Lands on an explicit-?date URL, so this branch is
        // structurally unrepeatable — no cap needed.
        router.replace(decision.replaceUrl)
      } else if (
        decision.action === 'refresh' &&
        lastRepair.current !== browserTimeZone
      ) {
        lastRepair.current = browserTimeZone ?? null
        router.refresh()
      }
    }

    return () => {
      if (isDateNav) dateNavInstances -= 1
    }
  }, [basePath, resolvedDate, hadExplicitDate, isDateNav, pathname, router])

  return null
}
