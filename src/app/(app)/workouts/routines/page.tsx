import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchUserProfile, fetchRoutines } from '@/lib/supabase/server'
import { RoutinesPageClient } from '@/components/routine/RoutinesPageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Routines' }

export default async function RoutinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  const routines = await fetchRoutines(supabase, user.id)

  return <RoutinesPageClient initialRoutines={routines} />
}
