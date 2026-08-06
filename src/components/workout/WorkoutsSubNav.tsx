'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — Train-pillar contextual navigation (Phase 4B.6A)
//
// Phase 2Q's shared destination list, aligned with the corrected
// contextual-nav pattern from Phases 4B.4/4B.5: the full-width
// border lives on a non-scrolling wrapper (overflow-x-auto forces
// computed overflow-y to auto, so a child hanging below the nav box
// would create a real 1px vertical scroll range), and matching is
// now ROUTE-AWARE instead of exact-only:
//
//   /workouts/routines(/**)  → Routines
//   /workouts/exercises(/**) → Exercise library
//   /workouts(/**) otherwise → Workouts (so /workouts/[id] keeps
//                              Workouts active — previously nothing
//                              was highlighted on detail pages)
//
// Longest-prefix precedence, boundary-safe (href + '/'), never a
// bare substring. Active = brand underline + weight + aria-current,
// never color alone. No persistence, no counts.
// ============================================================

const WORKOUT_SECTIONS = [
  { href: '/workouts', label: 'Workouts' },
  { href: '/workouts/routines', label: 'Routines' },
  { href: '/workouts/exercises', label: 'Exercise library' },
] as const

function activeHref(pathname: string): string | null {
  let best: string | null = null
  for (const { href } of WORKOUT_SECTIONS) {
    if (pathname === href || pathname.startsWith(href + '/')) {
      if (best === null || href.length > best.length) best = href
    }
  }
  return best
}

export function WorkoutsSubNav() {
  const pathname = usePathname()
  const current = activeHref(pathname)

  return (
    <div className="border-b border-edge-subtle">
      <nav
        aria-label="Workout sections"
        className="-mb-px flex items-center gap-1 overflow-x-auto"
      >
      {WORKOUT_SECTIONS.map((section) => {
        const active = current === section.href
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
              active
                ? 'border-brand font-semibold text-ink'
                : 'border-transparent font-medium text-ink-muted hover:text-ink'
            )}
          >
            {section.label}
          </Link>
        )
      })}
      </nav>
    </div>
  )
}
