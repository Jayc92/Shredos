'use client'

// ============================================================
// ForgeFitOS — Mobile bottom navigation (Phase 4B.2)
//
// Exactly five persistent pillars (Phase 4A decision): Today, Train,
// Fuel, Progress, Coach. No sixth slot, no Profile slot — Profile
// and other utilities live in the More surface. Hidden at the lg
// breakpoint and above (Tailwind default 1024px): the grouped
// sidebar is too dense for tablet widths, so tablets keep this
// mobile shell (QA correction — the shell switch moved md → lg).
//
// Fixed to the viewport bottom with safe-area padding; the app
// layout gives <main> matching bottom padding so no content is
// covered. Active pillar = top indicator bar + icon weight + label
// weight + aria-current — never color alone. Nested routes map to
// their pillar via route-match.ts (e.g. /check-in → Coach,
// /weigh-in → Progress).
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MOBILE_PILLARS, activePillarId } from '@/components/layout/route-match'
import { PILLAR_ICONS } from '@/components/layout/nav-items'

export function MobileBottomNav() {
  const pathname = usePathname()
  const activeId = activePillarId(pathname)

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-edge-subtle bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_PILLARS.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.id]
          const active = activeId === pillar.id
          return (
            <li key={pillar.id} className="relative">
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand"
                />
              )}
              <Link
                href={pillar.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 px-1 pt-1.5 pb-1 text-[11px] leading-none transition-colors',
                  active ? 'font-semibold text-brand-active' : 'font-medium text-ink-muted'
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden="true"
                />
                <span>{pillar.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
