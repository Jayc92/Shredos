import { redirect } from 'next/navigation'
import Link from 'next/link'
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
  fetchActivityLogForDate,
} from '@/lib/supabase/server'
import { WeightCard } from '@/components/dashboard/WeightCard'
import { NutritionCard } from '@/components/dashboard/NutritionCard'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'
import { FastingCard } from '@/components/dashboard/FastingCard'
import { StepsCard } from '@/components/dashboard/StepsCard'
import { CoachCard } from '@/components/coach/CoachCard'
import { DecisionLogCard } from '@/components/dashboard/DecisionLogCard'
import { computeFastingWeekStats } from '@/lib/fasting'
import { formatDateFull, todayISO } from '@/lib/dates'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { fetchNutritionCoachSummary } from '@/lib/nutrition-coach'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Today' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = todayISO()

  const [profile, weighIns, nutritionTarget, activeFast, recentDecisions, weekFasts, todayFoodLogs, workoutStats, coachSummary, todayActivityLog] =
    await Promise.all([
      fetchUserProfile(supabase, user.id),
      fetchRecentWeighIns(supabase, user.id, 20),
      fetchCurrentNutritionTarget(supabase, user.id),
      fetchActiveFast(supabase, user.id),
      fetchRecentDecisions(supabase, user.id, 5),
      fetchFastingLogsThisWeek(supabase, user.id),
      fetchFoodLogsForDate(supabase, user.id, today),
      fetchWorkoutWeekStats(supabase, user.id),
      fetchCoachSummary(supabase, user.id, today),
      // Phase 1H: today's step log for the StepsCard
      fetchActivityLogForDate(supabase, user.id, today),
    ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  // Phase 1F: nutrition coaching summary
  // Uses already-fetched nutritionTarget + todayFoodLogs — no extra round-trips for those
  const nutritionCoachSummary = await fetchNutritionCoachSummary(
    supabase, user.id, today, nutritionTarget, todayFoodLogs, profile.main_goal
  )

  const fastingStats = computeFastingWeekStats(weekFasts)
  const completedFasts = weekFasts.filter((f) => f.ended_at !== null)
  const lastCompletedFast = completedFasts[0] ?? null

  const todayLabel = formatDateFull(new Date())

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Good {getTimeOfDay()}, {profile.display_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1 mt-1 flex-shrink-0">
          <Link href="/check-in" className="text-xs text-primary hover:underline">
            Weekly check-in →
          </Link>
          <Link href="/coach" className="text-xs text-primary hover:underline">
            Coach actions →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeightCard weighIns={weighIns} profile={profile} />
        <NutritionCard
          target={nutritionTarget}
          todayLogs={todayFoodLogs}
          nutritionSummary={nutritionCoachSummary}
        />
        <FastingCard
          activeFast={activeFast}
          lastCompletedFast={lastCompletedFast}
          weekStats={fastingStats}
          fastingEnabled={profile.fasting_enabled}
        />
        <StepsCard stepGoal={profile.step_goal} todayLog={todayActivityLog} />
        <WorkoutCard stats={workoutStats} />
        {/* Phase 1E: CoachCard replaces static CoachAlertsCard placeholder */}
        <CoachCard summary={coachSummary} />
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
