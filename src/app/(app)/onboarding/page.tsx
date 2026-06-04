import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Set up your profile' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If already onboarded, go straight to dashboard
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_complete) redirect('/dashboard')

  return <OnboardingWizard />
}
