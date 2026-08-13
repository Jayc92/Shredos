import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchUserProfile } from '@/lib/supabase/server'
import { seedExercisesIfNeeded } from '@/lib/supabase/seed-exercises'
import { ExercisesClient } from '@/components/workout/ExercisesClient'
import type { Metadata } from 'next'
import type { Exercise } from '@/types/database'

export const metadata: Metadata = { title: 'Exercise library' }

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  await seedExercisesIfNeeded(supabase, user.id)

  // Phase 5A.6B: embed the authoritative exercise_muscles rows so the
  // library list displays secondary/tertiary targets and the edit
  // form prefills them (the deprecated secondary_muscles JSONB is
  // never read).
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*, exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false })
    .order('primary_muscle')
    .order('name')

  return (
    <ExercisesClient initialExercises={(exercises ?? []) as Exercise[]} />
  )
}
