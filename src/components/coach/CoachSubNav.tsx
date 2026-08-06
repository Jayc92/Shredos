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
    // The full-width border lives on this non-scrolling wrapper: with
    // overflow-x-auto on the nav, computed overflow-y becomes auto too,
    // so any child hanging below the nav box (the old -mb-px trick)
    // created a real 1px vertical scroll range — a visible scrollbar
    // under macOS "always show scrollbars" (4B.5 QA finding).
    <div className="border-b border-edge-subtle">
      <nav
        aria-label="Coach sections"
        className="-mb-px flex items-center gap-1 overflow-x-auto"
      >
      {COACH_SECTIONS.map((section) => {
        const active = pathname === section.href
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
