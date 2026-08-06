'use client'

// ============================================================
// ForgeFitOS — Progress-pillar contextual navigation (Phase 4B.5)
//
// One shared segmented navigation reused by /progress, /weigh-in,
// /activity, and /fasting so the measurement routes read as one
// workflow: Overview (cross-domain trends) → Weigh-in (body
// metrics) → Activity (daily steps) → Fasting (when enabled).
//
// Same pattern as CoachSubNav/WorkoutsSubNav: real links with
// aria-current="page"; active = brand underline + weight, never
// color alone. Overview matches route-aware (exercise detail pages
// under /progress/... keep Overview active); the other links match
// exactly. The Fasting link renders ONLY when the profile's
// fasting_enabled flag is true (passed from the server page — no
// client profile fetch); the direct /fasting URL stays reachable
// either way, matching prior phase decisions. No persistence, no
// counts.
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { href: '/progress', label: 'Overview' },
  { href: '/weigh-in', label: 'Weigh-in' },
  { href: '/activity', label: 'Activity' },
  { href: '/fasting', label: 'Fasting' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/progress') {
    // Route-aware: /progress and every /progress/* detail page.
    return pathname === '/progress' || pathname.startsWith('/progress/')
  }
  return pathname === href
}

export function ProgressSubNav({ fastingEnabled }: { fastingEnabled: boolean }) {
  const pathname = usePathname()
  const sections = SECTIONS.filter(
    (s) => s.href !== '/fasting' || fastingEnabled
  )

  return (
    // The full-width border lives on this non-scrolling wrapper: with
    // overflow-x-auto on the nav, computed overflow-y becomes auto too,
    // so any child hanging below the nav box (the old -mb-px trick)
    // created a real 1px vertical scroll range — a visible scrollbar
    // under macOS "always show scrollbars" (4B.5 QA finding).
    <div className="border-b border-edge-subtle">
      <nav
        aria-label="Progress sections"
        className="-mb-px flex items-center gap-1 overflow-x-auto"
      >
      {sections.map((section) => {
        const active = isActive(pathname, section.href)
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
