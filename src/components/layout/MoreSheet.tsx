'use client'

// ============================================================
// ForgeFitOS — More surface (Phase 4B.2)
//
// The mobile utility surface. Opens from the TopBar trigger — it is
// NOT a sixth bottom-nav slot. Provides every demoted-but-reachable
// utility destination (Phase 4A list): Profile, Decisions, Weekly
// review, Weigh-in, Activity, Fasting (only when enabled), Saved
// meals, Nutrition targets — plus Sign out, visually separated
// because it is an action, not a destination.
//
// Radix Dialog (via ui/sheet) supplies focus trap, Escape, outside
// click, focus return, and scroll lock. Navigating closes the sheet
// (controlled open state, closed on link click). The current route
// is indicated with a brand bar + weight + aria-current, never
// color alone. No persistence, no menu customization.
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetCloseButton,
} from '@/components/ui/sheet'
import { NAV_ROUTES, MORE_ROUTE_IDS, activeRouteId } from '@/components/layout/route-match'
import { NAV_ICONS } from '@/components/layout/nav-items'

interface MoreSheetProps {
  fastingEnabled: boolean
  /** Shortened account identity (email), shown muted — not a control. */
  displayName?: string
}

export function MoreSheet({ fastingEnabled, displayName }: MoreSheetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const currentId = activeRouteId(pathname)

  const items = MORE_ROUTE_IDS
    .map((id) => NAV_ROUTES.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r !== undefined)
    .filter((r) => !r.requiresFastingEnabled || fastingEnabled)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="More options"
        className="rounded-[var(--radius-control)] p-2 text-ink-secondary transition-colors hover:bg-surface-interactive hover:text-ink"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetCloseButton />
        </SheetHeader>

        <nav aria-label="More destinations" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {items.map((route) => {
              const Icon = NAV_ICONS[route.id]
              const active = currentId === route.id
              return (
                <li key={route.id}>
                  <Link
                    href={route.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-brand-subtle font-semibold text-ink'
                        : 'font-medium text-ink-secondary hover:bg-surface-interactive hover:text-ink'
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand"
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{route.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Account footer — Sign out separated from destinations. */}
        <div className="border-t border-edge-subtle p-2">
          {displayName && (
            <p className="truncate px-3 py-1 text-xs text-ink-muted" title={displayName}>
              {displayName}
            </p>
          )}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-interactive hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
