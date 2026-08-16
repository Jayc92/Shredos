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
import { localTodayFromCookies } from '@/lib/local-date-server'
import { ChevronLeft } from 'lucide-react'
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
    fetchExerciseTrends(supabase, user.id, exerciseIds, localTodayFromCookies()),
    fetchExerciseHistory(supabase, user.id, exerciseIds, params.id),
    fetchExercisePRBaseline(supabase, user.id, exerciseIds, params.id),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      {/* UI-5B1A: lucide chevron replaces the text-glyph arrow. */}
      <Link href="/workouts"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Workouts
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
