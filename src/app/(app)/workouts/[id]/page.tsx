import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchSessionWithDetails,
  fetchPreviousBests,
} from '@/lib/supabase/server'
import { SessionHeader } from '@/components/workout/SessionHeader'
import { WorkoutExerciseBlock } from '@/components/workout/WorkoutExerciseBlock'
import { AddExerciseSection } from '@/components/workout/AddExerciseSection'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Workout' }

export default async function WorkoutDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  const session = await fetchSessionWithDetails(supabase, user.id, params.id)
  if (!session) notFound()

  // Fetch all active exercises for the picker
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('primary_muscle')
    .order('name')

  // Fetch previous bests for all exercises in this session
  const exerciseIds = (session.workout_exercises ?? []).map((we: any) => we.exercise_id)
  const previousBests = await fetchPreviousBests(supabase, user.id, exerciseIds, params.id)

  const exercises = session.workout_exercises ?? []

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <Link href="/workouts" className="text-xs text-muted-foreground hover:text-foreground">
        ← Workouts
      </Link>

      <SessionHeader session={session} />

      {exercises.length === 0 && (
        <div className="shred-card text-center py-6 text-sm text-muted-foreground">
          No exercises yet. Add your first exercise below.
        </div>
      )}

      {exercises.map((we: any) => (
        <WorkoutExerciseBlock
          key={we.id}
          we={we}
          previousBest={previousBests[we.exercise_id] ?? null}
        />
      ))}

      <AddExerciseSection
        exercises={allExercises ?? []}
        workoutId={params.id}
      />
    </div>
  )
}
