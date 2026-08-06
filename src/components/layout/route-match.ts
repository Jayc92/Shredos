// ============================================================
// ForgeFitOS — Navigation Route Model + Active Matching (Phase 4B.2)
//
// The SINGLE source of truth for navigation routes, user-facing
// labels, grouping, and active-state matching. This module is pure
// data + pure functions — no React, no icons, no 'use client' — so
// the Phase 4B.2 harness can import it and exercise the real
// matching logic deterministically. nav-items.ts layers the icon
// components on top (one icon source of truth there).
//
// LABEL-ONLY RENAMES (Phase 4A decision, unchanged URLs, no
// redirects): /dashboard displays "Today", /check-in displays
// "Weekly review". Route folders and API routes are untouched.
//
// MATCHING RULES (documented precedence):
//   1. Paths are normalized first: query string and hash are
//      stripped, a trailing slash is removed (except bare '/').
//   2. An item matches when the path IS its href, or when the path
//      starts with `href + '/'` — never a naive substring or bare
//      startsWith, so '/food' can never match '/foodX'.
//   3. When several items match (e.g. /workouts/routines matches
//      both Workouts and Routines), the LONGEST matching href wins —
//      the deepest, most specific item is the active one.
//   4. `exact: true` items (Today) match only their exact href, so
//      hypothetical future /dashboard/* subroutes would not
//      silently light up Today.
//   5. Mobile pillars match by group prefix lists with the same
//      longest-prefix rule; /profile belongs to no pillar (Profile
//      is deliberately not a primary mobile slot), so no bottom-nav
//      slot is active there — the More surface indicates it instead.
// ============================================================

export type NavGroupId = 'today' | 'train' | 'fuel' | 'progress' | 'coach' | 'account'

export interface NavRoute {
  /** Stable id — also the icon-map key in nav-items.ts. */
  id: string
  /** The ONE user-facing label for this destination. */
  label: string
  href: string
  group: NavGroupId
  /** Match only the exact href (no nested-route inheritance). */
  exact?: boolean
  /** Rendered compact/indented under its group's primary row. */
  secondary?: boolean
  /** Appears only in the More surface, not in desktop groups. */
  moreOnly?: boolean
  /** Visible only when the profile's fasting_enabled flag is true. */
  requiresFastingEnabled?: boolean
}

/** Desktop group headings (visually subtle, non-interactive). */
export const NAV_GROUPS: ReadonlyArray<{ id: NavGroupId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'train', label: 'Train' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'progress', label: 'Progress' },
  { id: 'coach', label: 'Coach' },
  { id: 'account', label: 'Account' },
] as const

/**
 * Every navigable destination, in display order. URLs are the
 * existing route folders — unchanged, no redirects.
 */
export const NAV_ROUTES: ReadonlyArray<NavRoute> = [
  { id: 'today', label: 'Today', href: '/dashboard', group: 'today', exact: true },

  { id: 'workouts', label: 'Workouts', href: '/workouts', group: 'train' },
  { id: 'routines', label: 'Routines', href: '/workouts/routines', group: 'train', secondary: true },
  { id: 'exercise-library', label: 'Exercise library', href: '/workouts/exercises', group: 'train', secondary: true },

  { id: 'food', label: 'Food log', href: '/food', group: 'fuel' },
  { id: 'saved-meals', label: 'Saved meals', href: '/food/saved', group: 'fuel', moreOnly: true },
  { id: 'nutrition', label: 'Nutrition targets', href: '/nutrition', group: 'fuel' },

  { id: 'progress', label: 'Progress', href: '/progress', group: 'progress' },
  { id: 'weigh-in', label: 'Weigh-in', href: '/weigh-in', group: 'progress', secondary: true },
  { id: 'activity', label: 'Activity', href: '/activity', group: 'progress', secondary: true },
  { id: 'fasting', label: 'Fasting', href: '/fasting', group: 'progress', secondary: true, requiresFastingEnabled: true },

  { id: 'coach', label: 'Coach', href: '/coach', group: 'coach' },
  { id: 'weekly-review', label: 'Weekly review', href: '/check-in', group: 'coach' },
  { id: 'decisions', label: 'Decisions', href: '/decisions', group: 'coach' },

  { id: 'profile', label: 'Profile', href: '/profile', group: 'account' },
] as const

/**
 * The exactly-five persistent mobile pillars (Phase 4A decision —
 * no sixth slot, no Profile slot). Each pillar owns the route
 * prefixes that keep it highlighted for nested destinations.
 */
export interface MobilePillar {
  id: NavGroupId
  label: string
  href: string
  /** Path prefixes (longest-prefix matched) that activate this pillar. */
  prefixes: readonly string[]
}

export const MOBILE_PILLARS: ReadonlyArray<MobilePillar> = [
  { id: 'today', label: 'Today', href: '/dashboard', prefixes: ['/dashboard'] },
  { id: 'train', label: 'Train', href: '/workouts', prefixes: ['/workouts'] },
  { id: 'fuel', label: 'Fuel', href: '/food', prefixes: ['/food', '/nutrition'] },
  {
    id: 'progress',
    label: 'Progress',
    href: '/progress',
    // Fasting maps to Progress when enabled (accessed via More or
    // contextual navigation — it is not itself a slot).
    prefixes: ['/progress', '/weigh-in', '/activity', '/fasting'],
  },
  { id: 'coach', label: 'Coach', href: '/coach', prefixes: ['/coach', '/check-in', '/decisions'] },
] as const

/**
 * More-surface destinations, in display order (Phase 4A utility
 * list). Sign out is rendered separately by the sheet — it is an
 * action, not a route, and must stay visually separated.
 */
export const MORE_ROUTE_IDS: ReadonlyArray<string> = [
  'profile',
  'decisions',
  'weekly-review',
  'weigh-in',
  'activity',
  'fasting', // visible only when fasting is enabled
  'saved-meals',
  'nutrition',
] as const

// ── Pure matching helpers ────────────────────────────────────────────

/** Strip query/hash and any trailing slash (bare '/' is preserved). */
export function normalizePath(path: string): string {
  let p = path.split(/[?#]/)[0]
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p === '' ? '/' : p
}

function prefixMatchLength(path: string, href: string, exact?: boolean): number {
  if (path === href) return href.length
  if (exact) return 0
  return path.startsWith(href + '/') ? href.length : 0
}

/**
 * The single active destination for a path, or null. Longest
 * matching href wins, so /workouts/routines/abc activates Routines,
 * not Workouts; /workouts/abc123 (dynamic id) activates Workouts.
 */
export function activeRoute(pathname: string): NavRoute | null {
  const path = normalizePath(pathname)
  let best: NavRoute | null = null
  let bestLen = 0
  for (const route of NAV_ROUTES) {
    const len = prefixMatchLength(path, route.href, route.exact)
    if (len > bestLen) {
      best = route
      bestLen = len
    }
  }
  return best
}

/** Convenience wrapper used by nav components. */
export function activeRouteId(pathname: string): string | null {
  return activeRoute(pathname)?.id ?? null
}

/**
 * The active mobile pillar for a path, or null (e.g. /profile,
 * /onboarding). Longest-prefix rule as above.
 */
export function activePillarId(pathname: string): NavGroupId | null {
  const path = normalizePath(pathname)
  let best: MobilePillar | null = null
  let bestLen = 0
  for (const pillar of MOBILE_PILLARS) {
    for (const prefix of pillar.prefixes) {
      const len = prefixMatchLength(path, prefix)
      if (len > bestLen) {
        best = pillar
        bestLen = len
      }
    }
  }
  return best?.id ?? null
}

/**
 * Route-aware page label for the top bar. /dashboard → 'Today',
 * /check-in → 'Weekly review'; unknown paths fall back to the brand.
 */
export function routeLabel(pathname: string): string {
  return activeRoute(pathname)?.label ?? 'ForgeFitOS'
}
