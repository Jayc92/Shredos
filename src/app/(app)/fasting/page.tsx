import { redirect } from 'next/navigation'
import { createClient, fetchUserProfile, fetchActiveFast, fetchFastingLogsThisWeek } from '@/lib/supabase/server'
import { FastingTimer } from '@/components/fasting/FastingTimer'
import { FastingControls } from '@/components/fasting/FastingControls'
import { FastingHistory } from '@/components/fasting/FastingHistory'
import { FastingStats } from '@/components/fasting/FastingStats'
import { computeFastingWeekStats } from '@/lib/fasting'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Fasting' }

export default async function FastingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, activeFast, weekFasts] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchActiveFast(supabase, user.id),
    fetchFastingLogsThisWeek(supabase, user.id),
  ])

  if (!profile) redirect('/onboarding')

  // All past fasts (not just this week) for history
  const { data: allFasts } = await supabase
    .from('fasting_logs')
    .select('*')
    .eq('user_id', user.id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(50)

  const weekStats = computeFastingWeekStats(weekFasts)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Fasting</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fasting is a calorie adherence tool — not magic. Calories still determine fat loss.
        </p>
      </div>

      {/* Live timer (client component) — only shown when there's an active fast */}
      {activeFast && <FastingTimer fast={activeFast} />}

      {/* Start/End controls */}
      <FastingControls
        activeFast={activeFast}
        defaultGoalHours={profile.default_fasting_goal_hours}
      />

      {/* This-week stats */}
      <FastingStats stats={weekStats} />

      {/* History */}
      <FastingHistory fasts={allFasts ?? []} />
    </div>
  )
}
