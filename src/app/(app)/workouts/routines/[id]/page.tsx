import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchUserProfile, fetchRoutineWithExercises } from '@/lib/supabase/server'
import { RoutineDetailClient } from '@/components/routine/RoutineDetailClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Routine' }

export default async function RoutineDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  const routine = await fetchRoutineWithExercises(supabase, user.id, params.id)
  if (!routine) notFound()

  // Fetch all active exercises for the ExercisePicker
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('primary_muscle')
    .order('name')

  return (
    <RoutineDetailClient
      routine={routine}
      allExercises={allExercises ?? []}
    />
  )
}
