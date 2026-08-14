// ============================================================
// ForgeFitOS — Customize dashboard route (UI-3)
// Server component: auth gate + one profile read (the same
// authenticated pattern every route uses), normalize the stored
// preferences, and hand plain props to the client editor. Edits are
// LOCAL until Save — Cancel and Reset never persist by themselves.
// ============================================================

import { redirect } from 'next/navigation'
import { createClient, fetchUserProfile } from '@/lib/supabase/server'
import { normalizeDashboardPrefs } from '@/lib/dashboard-prefs'
import { CustomizeDashboardClient } from '@/components/dashboard/CustomizeDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customize dashboard' }

export default async function CustomizeDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  // Read-side normalization: missing / '{}' / malformed / old-version
  // documents all become the complete canonical V1.
  const prefs = normalizeDashboardPrefs(profile.dashboard_prefs)

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <CustomizeDashboardClient
        initialPrefs={prefs}
        fastingEnabled={profile.fasting_enabled}
      />
    </div>
  )
}
