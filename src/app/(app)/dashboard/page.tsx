import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchRecentWeighIns,
  fetchCurrentNutritionTarget,
  fetchActiveFast,
  fetchRecentDecisions,
  fetchFastingLogsThisWeek,
  fetchFoodLogsForDate,
  fetchWorkoutWeekStats,
} from '@/lib/supabase/server'
import { WeightCard } from '@/components/dashboard/WeightCard'
import { NutritionCard } from '@/components/dashboard/NutritionCard'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'
import { FastingCard } from '@/components/dashboard/FastingCard'
import { StepsCard } from '@/components/dashboard/StepsCard'
import { CoachAlertsCard } from '@/components/dashboard/CoachAlertsCard'
import { DecisionLogCard } from '@/components/dashboard/DecisionLogCard'
import { computeFastingWeekStats } from '@/lib/fasting'
import { formatDateFull, todayISO } from '@/lib/dates'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Parallel data fetch — no waterfalls
  const today = todayISO()

  const [profile, weighIns, nutritionTarget, activeFast, recentDecisions, weekFasts, todayFoodLogs, workoutStats] =
    await Promise.all([
      fetchUserProfile(supabase, user.id),
      fetchRecentWeighIns(supabase, user.id, 20),
      fetchCurrentNutritionTarget(supabase, user.id),
      fetchActiveFast(supabase, user.id),
      fetchRecentDecisions(supabase, user.id, 5),
      fetchFastingLogsThisWeek(supabase, user.id),
      fetchFoodLogsForDate(supabase, user.id, today),
      fetchWorkoutWeekStats(supabase, user.id),
    ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  const fastingStats = computeFastingWeekStats(weekFasts)
  const completedFasts = weekFasts.filter((f) => f.ended_at !== null)
  const lastCompletedFast = completedFasts[0] ?? null

  const todayLabel = formatDateFull(new Date())

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Good {getTimeOfDay()}, {profile.display_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
      </div>

      {/* Dashboard grid — 1 col mobile, 2 col tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeightCard weighIns={weighIns} profile={profile} />
        <NutritionCard target={nutritionTarget} todayLogs={todayFoodLogs} />
        <FastingCard
          activeFast={activeFast}
          lastCompletedFast={lastCompletedFast}
          weekStats={fastingStats}
          fastingEnabled={profile.fasting_enabled}
        />
        <StepsCard stepGoal={profile.step_goal} />
        <WorkoutCard stats={workoutStats} />
        <CoachAlertsCard decisions={recentDecisions} />
        <div className="sm:col-span-2">
          <DecisionLogCard decision={recentDecisions[0] ?? null} />
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
