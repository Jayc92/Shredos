'use client'

// ============================================================
// ForgeFitOS — Coach-pillar contextual navigation (Phase 4B.4)
//
// One shared segmented navigation reused by /coach, /check-in, and
// /decisions so the three decision-support routes read as one
// workflow: Coach (current-week guidance) → Weekly review (completed-
// week evidence) → Decisions (user-controlled follow-through).
//
// Same pattern as WorkoutsSubNav (Phase 2Q): real links between real
// pages with exact-match active state and aria-current="page" — not
// ARIA tabs. Active = brand underline + weight, never color alone.
// This is contextual navigation WITHIN the Coach pillar; the global
// sidebar/bottom nav (4B.2) remain the primary navigation and are
// not duplicated conceptually — these three routes all live under
// the Coach pillar there. No persistence, no badge counts.
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const COACH_SECTIONS = [
  { href: '/coach', label: 'Coach' },
  { href: '/check-in', label: 'Weekly review' },
  { href: '/decisions', label: 'Decisions' },
] as const

export function CoachSubNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Coach sections"
      className="flex items-center gap-1 overflow-x-auto border-b border-edge-subtle"
    >
      {COACH_SECTIONS.map((section) => {
        const active = pathname === section.href
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
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
  )
}
