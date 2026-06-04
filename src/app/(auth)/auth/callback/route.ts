import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles the magic link callback from Supabase Auth.
 * Exchanges the code for a session, then redirects:
 *   - No profile or onboarding incomplete → /onboarding
 *   - Profile complete → /dashboard (or ?next= param)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Check if the user needs to complete onboarding
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!profile || !profile.onboarding_complete) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  // Validate the `next` param to prevent open redirects
  const safeNext = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
