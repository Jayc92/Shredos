import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

// ============================================================
// ForgeFitOS — App shell (Phase 4B.2)
//
// Server component (client/server split): this layout does the auth
// gate and the ONE profile visibility read (fasting_enabled), then
// passes plain props down to the small client shell components
// (Sidebar, TopBar/MoreSheet, MobileBottomNav) — the page content
// itself never becomes part of a client boundary because of the
// shell.
//
// Fasting gating: fasting_enabled is the existing authoritative
// profile field. It is fetched HERE, server-side, exactly once —
// no client refetch, no flash of the Fasting item appearing after
// hydration, no duplicated profile state across shell components.
// A failed or missing read is treated as NOT enabled (a query
// failure must never reveal the item), and the /fasting route
// itself stays reachable by direct URL either way. The Profile page
// already calls router.refresh() after saving, which re-renders
// this layout, so toggling the setting updates the navigation.
// ============================================================

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('fasting_enabled')
    .eq('user_id', user.id)
    .single()

  // Strict === true: null row, query error, or unexpected shape all
  // gate the Fasting navigation OFF rather than on.
  const fastingEnabled = profile?.fasting_enabled === true
  const displayName = user.email ?? 'ForgeFitOS'

  return (
    // fixed inset-0: the shell is pinned to the viewport and REMOVED
    // from normal document flow — proven in live Safari (4B.6C QA):
    // any in-flow shell, however sized (h-screen, h-dvh, h-full all
    // failed physical QA), leaves the root able to develop its own
    // scroll range under fractional viewports (zoom rounding, display
    // scaling, classic scrollbars, URL-bar states), which painted a
    // second document scrollbar alongside <main>'s. Out of flow, the
    // document has no in-flow content to scroll, so <main> is the
    // sole app-content scroll owner by construction. No height class:
    // inset-0 already binds both edges to the viewport.
    <div className="fixed inset-0 flex overflow-hidden bg-canvas">
      {/* Grouped sidebar — desktop only */}
      <Sidebar
        fastingEnabled={fastingEnabled}
        displayName={displayName}
        className="hidden lg:flex w-56 flex-shrink-0 h-full"
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Route-aware top bar (mobile: brand + label + More trigger;
            desktop: slim label strip) */}
        <TopBar fastingEnabled={fastingEnabled} displayName={displayName} />

        {/* Scrollable content. Mobile gets bottom padding matching the
            fixed bottom navigation (height + safe-area inset) so no
            content is ever covered; desktop needs none. */}
        <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>

      {/* Five-pillar bottom navigation — mobile only */}
      <MobileBottomNav />
    </div>
  )
}
