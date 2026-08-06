import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchRecentSessions,
  fetchWorkoutWeekStats,
  findActiveTrainingSession,
} from '@/lib/supabase/server'
import { seedExercisesIfNeeded } from '@/lib/supabase/seed-exercises'
import { weeklyMuscleVolume } from '@/lib/workout'
import { SessionCard } from '@/components/workout/SessionCard'
import { MuscleVolumeSummary } from '@/components/workout/MuscleVolumeSummary'
import { MuscleReadinessPanel } from '@/components/coach/MuscleReadinessPanel'
import { CreateWorkoutButton } from '@/components/workout/CreateWorkoutButton'
import { WorkoutsSubNav } from '@/components/workout/WorkoutsSubNav'
import { Card, CardContent } from '@/components/ui/card'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { todayISO } from '@/lib/dates'
import { Dumbbell, Play } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Workouts' }

// ============================================================
// ForgeFitOS — Workouts hub (Phase 4B.6A redesign)
//
// Hierarchy: header → Train subnav → active-workout resume action
// (when one exists) → week summary + create action → readiness →
// routines entry → today's sessions → weekly muscle volume →
// recent sessions → empty state.
//
// Every query and behavior is preserved; the ONE data addition is
// findActiveTrainingSession — the same existing Phase 2K helper the
// Today page and workout APIs already use — so the hub can lead
// with "resume". Display-only (.catch → null): a failed read hides
// the resume card and the API-level guard stays authoritative. No
// streaks, no adherence scores, no invented recommendations.
// ============================================================

export default async function WorkoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  await seedExercisesIfNeeded(supabase, user.id)

  const today = todayISO()

  const [sessions, weekStats, coachSummary, activeSession] = await Promise.all([
    fetchRecentSessions(supabase, user.id, 15),
    fetchWorkoutWeekStats(supabase, user.id),
    fetchCoachSummary(supabase, user.id, today),
    findActiveTrainingSession(supabase, user.id).catch(() => null),
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
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink flex items-center gap-2">
          <Dumbbell className="w-5 h-5" aria-hidden="true" /> Workouts
        </h1>
      </div>

      <WorkoutsSubNav />

      {/* Active workout — the most immediate action when one exists;
          rendered only then, so no conditional blank space. */}
      {activeSession && (
        <Card variant="action" className="gap-0 py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">Active workout</h2>
              <p className="text-xs text-ink-muted">
                Pick up where you left off — your sets are saved as you go.
              </p>
            </div>
            <Link
              href={`/workouts/${activeSession.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Resume workout
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Week summary + create action */}
      <Card variant="elevated" className="gap-0 py-4">
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">
              {weekStats.sessions_this_week} session{weekStats.sessions_this_week !== 1 ? 's' : ''} this week
            </p>
            {weekStats.last_session && (
              <p className="text-xs text-ink-muted mt-0.5">
                Last: {weekStats.last_session.title || 'Workout'} · {weekStats.last_session_exercise_count} exercise{weekStats.last_session_exercise_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <CreateWorkoutButton />
        </CardContent>
      </Card>

      {/* Phase 1E: Muscle readiness — hidden until enough data */}
      <MuscleReadinessPanel summary={coachSummary} />

      {/* Routines entry point (Phase 1D) */}
      <Link href="/workouts/routines" className="block">
        <Card variant="interactive" className="gap-0 py-4">
          <CardContent className="flex items-center justify-between">
            {weekStats.active_routine_count > 0 ? (
              <div>
                <p className="text-sm font-medium text-ink">Routines</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {weekStats.active_routine_count} saved · Start a structured workout
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Build routines to start structured workouts →</p>
            )}
            <span className="text-ink-muted text-xs" aria-hidden="true">›</span>
          </CardContent>
        </Card>
      </Link>

      {/* Today */}
      {todaySessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Today</h2>
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
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Recent sessions</h2>
          {otherSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
        </div>
      )}

      {sessions.length === 0 && (
        <Card variant="status" className="gap-0 py-10">
          <CardContent className="space-y-3 text-center">
            <p className="text-ink-muted text-sm">No workouts yet.</p>
            <p className="text-xs text-ink-muted">Start logging to track progressive overload and weekly muscle volume.</p>
            <CreateWorkoutButton label="Start your first workout" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
