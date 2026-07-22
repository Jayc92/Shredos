import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Root route. No UI of its own — resolves the "/" 404 by redirecting
 * based on session state, mirroring the exact auth-check pattern already
 * used in (app)/layout.tsx (same createClient() + getUser() + redirect()).
 *
 *   - Valid session -> /dashboard
 *   - No session    -> /login
 *
 * Does not check onboarding_complete: (app)/layout.tsx itself doesn't
 * either, so this matches existing app-wide behavior rather than
 * introducing a new rule.
 */
export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  redirect('/login')
}
