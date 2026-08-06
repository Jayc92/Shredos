'use client'

// ============================================================
// ForgeFitOS — Top bar (Phase 4B.2)
//
// One responsive component, two densities:
//
//   Mobile (< md): brand mark + route-aware page label + the More
//   trigger (MoreSheet). The old homemade drawer is retired — the
//   More surface (Radix sheet) replaces it with real dialog
//   semantics. The bottom navigation carries the five pillars, so
//   the top bar stays minimal.
//
//   Desktop (md+): a slim strip with the route label only. The
//   wordmark lives in the Sidebar (no duplication); the account
//   email + Sign out moved to the Sidebar utility footer, so the
//   old right-aligned email strip is gone.
//
// The label comes from routeLabel() — the same single label source
// the navigation uses — so /dashboard shows "Today" and /check-in
// shows "Weekly review". It is a <span>, not a heading: every page
// keeps its own real H1.
// ============================================================

import { usePathname } from 'next/navigation'
import { BrandMark } from '@/components/layout/BrandMark'
import { MoreSheet } from '@/components/layout/MoreSheet'
import { routeLabel } from '@/components/layout/route-match'

interface TopBarProps {
  fastingEnabled: boolean
  displayName?: string
}

export function TopBar({ fastingEnabled, displayName }: TopBarProps) {
  const pathname = usePathname()
  const label = routeLabel(pathname)

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-edge-subtle bg-surface px-4 lg:h-12 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <BrandMark className="size-7 lg:hidden" />
        <span className="truncate text-sm font-semibold text-ink">{label}</span>
      </div>

      {/* More trigger — mobile only; desktop reaches everything via
          the grouped sidebar. */}
      <div className="lg:hidden">
        <MoreSheet fastingEnabled={fastingEnabled} displayName={displayName} />
      </div>
    </header>
  )
}
