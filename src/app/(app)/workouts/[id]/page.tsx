import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchSessionWithDetails,
  fetchPreviousBests,
  fetchExerciseHistory,
  fetchExercisePRBaseline,
} from '@/lib/supabase/server'
import { WorkoutDetailClient } from '@/components/workout/WorkoutDetailClient'
import { WorkoutsSubNav } from '@/components/workout/WorkoutsSubNav'
import { fetchExerciseTrends } from '@/lib/workout-coach'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Workout' }

export default async function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  const session = await fetchSessionWithDetails(supabase, user.id, params.id)
  if (!session) notFound()

  const { data: allExercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('primary_muscle')
    .order('name')

  const exercises = (session as any).workout_exercises ?? []
  const exerciseIds = exercises.map((we: any) => we.exercise_id)

  // Fetch in parallel — all four are independent
  const [previousBests, exerciseTrends, exerciseHistory, prBaseline] = await Promise.all([
    fetchPreviousBests(supabase, user.id, exerciseIds, params.id),
    fetchExerciseTrends(supabase, user.id, exerciseIds),
    fetchExerciseHistory(supabase, user.id, exerciseIds, params.id),
    fetchExercisePRBaseline(supabase, user.id, exerciseIds, params.id),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <Link href="/workouts" className="text-xs text-ink-muted hover:text-ink">
        ← Workouts
      </Link>

      <WorkoutsSubNav />

      <WorkoutDetailClient
        session={session}
        exercises={exercises}
        previousBests={previousBests}
        allExercises={allExercises ?? []}
        routineId={(session as any).routine?.id ?? null}
        routineName={(session as any).routine?.name ?? null}
        exerciseTrends={exerciseTrends}
        exerciseHistory={exerciseHistory}
        prBaseline={prBaseline}
      />
    </div>
  )
}
