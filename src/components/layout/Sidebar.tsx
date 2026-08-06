'use client'

// ============================================================
// ForgeFitOS — Grouped desktop sidebar (Phase 4B.2)
//
// Renders the approved pillar grouping from route-match.ts (single
// source of truth for routes/labels/matching; nav-items.ts for
// icons): Today / Train / Fuel / Progress / Coach / Account.
// Group headings are subtle, non-interactive labels — never links.
// Secondary destinations (Routines, Exercise library, Weigh-in,
// Activity, Fasting) render compact and indented so the sidebar is
// a hierarchy, not twelve equal rows.
//
// Active state = brand bar + background tint + font weight +
// aria-current (never color alone). Longest-match precedence means
// /workouts/routines activates Routines, not Workouts.
//
// Sign out lives in the utility footer with the (truncated) account
// email — separated from product navigation. Fasting appears only
// when the profile's fasting_enabled flag is true (passed down from
// the server layout — no client profile fetch here).
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandWordmark } from '@/components/layout/BrandMark'
import { NAV_GROUPS, NAV_ROUTES, activeRouteId } from '@/components/layout/route-match'
import { NAV_ICONS } from '@/components/layout/nav-items'

interface SidebarProps {
  fastingEnabled: boolean
  /** Account identity for the utility footer (truncated, muted). */
  displayName?: string
  className?: string
}

export function Sidebar({ fastingEnabled, displayName, className }: SidebarProps) {
  const pathname = usePathname()
  const currentId = activeRouteId(pathname)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col w-56 border-r border-edge-subtle bg-surface',
        className
      )}
    >
      {/* Brand header */}
      <div className="flex h-12 flex-shrink-0 items-center border-b border-edge-subtle px-4">
        <BrandWordmark />
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ROUTES.filter(
            (r) =>
              r.group === group.id &&
              !r.moreOnly &&
              (!r.requiresFastingEnabled || fastingEnabled)
          )
          if (items.length === 0) return null
          return (
            <div key={group.id} className="pb-1">
              {/* Non-interactive group heading (not a link, not a button). */}
              <div
                aria-hidden="true"
                className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted"
              >
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {items.map((route) => {
                  const Icon = NAV_ICONS[route.id]
                  const active = currentId === route.id
                  return (
                    <li key={route.id}>
                      <Link
                        href={route.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 transition-colors',
                          route.secondary ? 'py-1.5 text-[13px]' : 'py-2 text-sm',
                          active
                            ? 'bg-brand-subtle font-semibold text-ink'
                            : 'font-medium text-ink-secondary hover:bg-surface-interactive hover:text-ink'
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand"
                          />
                        )}
                        <Icon
                          className={cn('shrink-0', route.secondary ? 'h-4 w-4' : 'h-[18px] w-[18px]')}
                          aria-hidden="true"
                        />
                        <span>{route.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Utility footer — account identity + Sign out, separated from
          product navigation. */}
      <div className="flex-shrink-0 border-t border-edge-subtle p-2">
        {displayName && (
          <p className="truncate px-3 py-1 text-xs text-ink-muted" title={displayName}>
            {displayName}
          </p>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-interactive hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
