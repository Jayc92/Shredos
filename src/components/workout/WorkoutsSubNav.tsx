'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Phase 2Q: single shared destination list for the three top-level
// workout pages, rendered identically by all three -- avoids the
// exact "two copies drift apart" risk that motivated nav-items.ts in
// Phase 1K. This is a separate, smaller sub-navigation layer; it does
// not touch or replace the global Sidebar/TopBar/nav-items.ts, whose
// single "Workouts" entry correctly stays active throughout this
// entire section.
const WORKOUT_SECTIONS = [
  { href: '/workouts', label: 'Workouts' },
  { href: '/workouts/routines', label: 'Routines' },
  { href: '/workouts/exercises', label: 'Exercise library' },
] as const

/**
 * Persistent cross-navigation between Workouts, Routines, and
 * Exercise Library (Phase 2Q). These are links between real pages,
 * not ARIA tabs controlling panels within one document, so this uses
 * plain nav/Link semantics with aria-current="page" on the active
 * link -- not role="tab"/aria-selected.
 *
 * Active-state matching is deliberately exact (pathname === href),
 * not the startsWith-based logic Sidebar.tsx/TopBar.tsx use for the
 * primary nav -- that broader matching is exactly why all three of
 * these pages look identically "active" in the global nav today; this
 * component exists specifically to distinguish them, so it must not
 * inherit the same conflation.
 */
export function WorkoutsSubNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Workout sections" className="flex items-center gap-1 border-b border-border">
      {WORKOUT_SECTIONS.map((section) => {
        const active = pathname === section.href
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
