import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchUserProfile, fetchRecentSessions, fetchWorkoutWeekStats } from '@/lib/supabase/server'
import { seedExercisesIfNeeded } from '@/lib/supabase/seed-exercises'
import { weeklyMuscleVolume } from '@/lib/workout'
import { SessionCard } from '@/components/workout/SessionCard'
import { MuscleVolumeSummary } from '@/components/workout/MuscleVolumeSummary'
import { MuscleReadinessPanel } from '@/components/coach/MuscleReadinessPanel'
import { CreateWorkoutButton } from '@/components/workout/CreateWorkoutButton'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { todayISO } from '@/lib/dates'
import { Dumbbell } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Workouts' }

export default async function WorkoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  await seedExercisesIfNeeded(supabase, user.id)

  const today = todayISO()

  const [sessions, weekStats, coachSummary] = await Promise.all([
    fetchRecentSessions(supabase, user.id, 15),
    fetchWorkoutWeekStats(supabase, user.id),
    fetchCoachSummary(supabase, user.id, today),
  ])

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: weekSessions } = await supabase
    .from('workout_sessions')
    .select('workout_exercises(exercise:exercises(primary_muscle), workout_sets(completed, is_warmup))')
    .eq('user_id', user.id)
    .in('status', ['in_progress', 'completed'])
    .gte('workout_date', sevenDaysAgo.toISOString().split('T')[0])

  const muscleVolume = weeklyMuscleVolume((weekSessions ?? []) as any)
  const todaySessions = sessions.filter((s: any) => s.workout_date === today)
  const otherSessions = sessions.filter((s: any) => s.workout_date !== today)

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Dumbbell className="w-5 h-5" aria-hidden="true" /> Workouts
        </h1>
        <Link href="/workouts/exercises" className="text-xs text-primary hover:underline">
          Exercise library →
        </Link>
      </div>

      {/* Week summary + create button */}
      <div className="shred-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {weekStats.sessions_this_week} session{weekStats.sessions_this_week !== 1 ? 's' : ''} this week
            </p>
            {weekStats.last_session && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last: {weekStats.last_session.title || 'Workout'} · {weekStats.last_session_exercise_count} exercise{weekStats.last_session_exercise_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <CreateWorkoutButton />
        </div>
      </div>

      {/* Phase 1E: Muscle readiness — hidden until enough data */}
      <MuscleReadinessPanel summary={coachSummary} />

      {/* Routines entry point (Phase 1D) */}
      {weekStats.active_routine_count > 0 ? (
        <a href="/workouts/routines"
          className="block shred-card hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Routines</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {weekStats.active_routine_count} saved · Start a structured workout
              </p>
            </div>
            <span className="text-muted-foreground text-xs">›</span>
          </div>
        </a>
      ) : (
        <a href="/workouts/routines"
          className="block shred-card hover:border-border/80 transition-colors">
          <p className="text-sm text-muted-foreground">Build routines to start structured workouts →</p>
        </a>
      )}

      {/* Today */}
      {todaySessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</p>
          {todaySessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
        </div>
      )}

      {/* Muscle volume */}
      {Object.keys(muscleVolume).length > 0 && (
        <MuscleVolumeSummary volume={muscleVolume} />
      )}

      {/* History */}
      {otherSessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent sessions</p>
          {otherSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="shred-card text-center py-10 space-y-3">
          <p className="text-muted-foreground text-sm">No workouts yet.</p>
          <p className="text-xs text-muted-foreground">Start logging to track progressive overload and weekly muscle volume.</p>
          <CreateWorkoutButton label="Start your first workout" />
        </div>
      )}
    </div>
  )
}
