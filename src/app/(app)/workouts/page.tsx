import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchRecentSessions,
  fetchWorkoutWeekStats,
  findActiveTrainingSession,
} from '@/lib/supabase/server'
import { initializeExercisesIfNeeded } from '@/lib/supabase/deliver-catalog'
import { weeklyMuscleVolume } from '@/lib/workout'
import { SessionCard } from '@/components/workout/SessionCard'
import { MuscleVolumeSummary } from '@/components/workout/MuscleVolumeSummary'
import { MuscleReadinessPanel } from '@/components/coach/MuscleReadinessPanel'
import { CreateWorkoutButton } from '@/components/workout/CreateWorkoutButton'
import { LogPastWorkoutForm } from '@/components/workout/LogPastWorkoutForm'
import { WorkoutsSubNav } from '@/components/workout/WorkoutsSubNav'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { localTodayFromCookies } from '@/lib/local-date-server'
import { addDaysISO } from '@/lib/local-date'
import { ChevronRight, Play } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Workouts' }

// ============================================================
// ForgeFitOS — Workouts hub (UI-5A Train discovery rebuild)
//
// Hierarchy: PageHeader, then Train subnav, then active-workout
// resume action (when one exists), then week summary + create
// action, then log a past workout, then the responsive body grid.
// On lg+ the body splits into a session column (Today, then Recent
// sessions, then empty state) and a supporting rail (readiness,
// then routines entry, then weekly muscle volume) with natural
// independent heights; below lg everything is one column. Width max-w-6xl (UI-5A approved).
//
// Every query and behavior is preserved from 4B.6A; the ONE data
// addition remains findActiveTrainingSession — the same existing
// Phase 2K helper the Today page and workout APIs already use — so
// the hub can lead with "resume". Display-only (.catch to null): a
// failed read hides the resume card and the API-level guard stays
// authoritative. No streaks, no adherence scores, no invented
// recommendations.
// ============================================================

export default async function WorkoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  await initializeExercisesIfNeeded(supabase, user.id)

  // Local-date fix: the user's calendar day (timezone cookie), not
  // the server's UTC day.
  const today = localTodayFromCookies()

  const [sessions, weekStats, coachSummary, activeSession] = await Promise.all([
    fetchRecentSessions(supabase, user.id, 15),
    fetchWorkoutWeekStats(supabase, user.id),
    fetchCoachSummary(supabase, user.id, today),
    findActiveTrainingSession(supabase, user.id).catch(() => null),
  ])

  const sevenDaysAgo = addDaysISO(today, -7)
  const { data: weekSessions } = await supabase
    .from('workout_sessions')
    .select('workout_exercises(exercise:exercises(primary_muscle), workout_sets(completed, is_warmup))')
    .eq('user_id', user.id)
    .in('status', ['in_progress', 'completed'])
    .gte('workout_date', sevenDaysAgo)

  const muscleVolume = weeklyMuscleVolume((weekSessions ?? []) as any)
  const todaySessions = sessions.filter((s: any) => s.workout_date === today)
  const otherSessions = sessions.filter((s: any) => s.workout_date !== today)

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      <PageHeader title="Workouts" />

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

      {/* Phase 5A.2: secondary path for a workout that already
          happened — never blocks or is blocked by the live flow. */}
      <LogPastWorkoutForm />

      {/* UI-5A body grid: session history is the main column; the
          supporting analytics/navigation rail sits beside it on lg+.
          lg:items-start keeps every card at its natural height (the
          UI-2 lesson: grid's default stretch fabricates tall cards).
          Below lg this renders as the single column, sessions first. */}
      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <div className="space-y-5 lg:col-span-7 xl:col-span-8">
          {/* Today */}
          {todaySessions.length > 0 && (
            <section className="space-y-2">
              <SectionHeader title="Today" />
              {todaySessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
            </section>
          )}

          {/* History */}
          {otherSessions.length > 0 && (
            <section className="space-y-2">
              <SectionHeader title="Recent sessions" />
              {otherSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
            </section>
          )}

          {sessions.length === 0 && (
            <Card variant="status" className="gap-0 py-10">
              <CardContent>
                <EmptyState
                  title="No workouts yet."
                  description="Start logging to track progressive overload and weekly muscle volume."
                  action={<CreateWorkoutButton label="Start your first workout" />}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          {/* Phase 1E: Muscle readiness — hidden until enough data */}
          <MuscleReadinessPanel summary={coachSummary} />

          {/* Routines entry point (Phase 1D) */}
          <Link href="/workouts/routines" className="block">
            <Card variant="interactive" className="gap-0 py-4">
              <CardContent className="flex items-center justify-between gap-3">
                {weekStats.active_routine_count > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-ink">Routines</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {weekStats.active_routine_count} saved · Start a structured workout
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">Build routines to start structured workouts</p>
                )}
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-muted" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>

          {/* Muscle volume */}
          {Object.keys(muscleVolume).length > 0 && (
            <MuscleVolumeSummary volume={muscleVolume} />
          )}
        </div>
      </div>
    </div>
  )
}
