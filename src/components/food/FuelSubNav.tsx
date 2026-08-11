'use client'

// ============================================================
// ForgeFitOS — Fuel-pillar contextual navigation (Phase 4B.6C)
//
// Shared segmented navigation for /food, /food/saved, and
// /nutrition, using the corrected border-wrapper pattern from the
// Progress/Coach/Train subnavs (the full-width border lives on a
// non-scrolling wrapper; overflow-x-auto would otherwise turn a
// 1px child overhang into a real vertical scroll range).
//
// Matching is EXACT per destination — /food/saved must activate
// Saved meals, never Food log, so no prefix inheritance is used.
// Active = brand underline + weight + aria-current, never color
// alone. No persistence, no counts.
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const FUEL_SECTIONS = [
  { href: '/food', label: 'Food log' },
  { href: '/food/saved', label: 'Saved meals' },
  { href: '/nutrition', label: 'Nutrition targets' },
] as const

export function FuelSubNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-edge-subtle">
      <nav
        aria-label="Fuel sections"
        className="-mb-px flex items-center gap-1 overflow-x-auto"
      >
      {FUEL_SECTIONS.map((section) => {
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
