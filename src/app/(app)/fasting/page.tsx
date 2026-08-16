import { redirect } from 'next/navigation'
import { createClient, fetchUserProfile, fetchActiveFast, fetchFastingLogsThisWeek } from '@/lib/supabase/server'
import { FastingTimer } from '@/components/fasting/FastingTimer'
import { FastingControls } from '@/components/fasting/FastingControls'
import { FastingHistory } from '@/components/fasting/FastingHistory'
import { FastingStats } from '@/components/fasting/FastingStats'
import { computeFastingWeekStats } from '@/lib/fasting'
import { ProgressSubNav } from '@/components/progress/ProgressSubNav'
import { PageHeader } from '@/components/ui/page-header'
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
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      {/* UI-6B: PageHeader primitive; the honest support copy is the
          page's established framing and stays verbatim. */}
      <PageHeader
        title="Fasting"
        description="Fasting is a calorie adherence tool — not magic. Calories still determine fat loss."
      />

      {/* Contextual nav: the Fasting link inside it follows the
          profile flag; the direct route itself stays reachable
          regardless (existing policy, unchanged). */}
      <ProgressSubNav fastingEnabled={profile.fasting_enabled} />

      {/* UI-6B wide-route composition: the fasting task surface
          (timer + controls) is the primary column; this-week stats
          and the completed history form the supporting column at lg.
          Mobile keeps the established task-first order — timer,
          controls, stats, history — because the primary column
          renders first in the DOM. items-start: natural heights,
          never equal-height forcing. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6 space-y-5 lg:space-y-0">
        <div className="space-y-5">
          {/* Live timer (client component) — only shown when there's an active fast */}
          {activeFast && <FastingTimer fast={activeFast} />}

          {/* Start/End controls */}
          <FastingControls
            activeFast={activeFast}
            defaultGoalHours={profile.default_fasting_goal_hours}
          />
        </div>

        <div className="mt-5 space-y-5 lg:mt-0">
          {/* This-week stats */}
          <FastingStats stats={weekStats} />

          {/* History */}
          <FastingHistory fasts={allFasts ?? []} />
        </div>
      </div>
    </div>
  )
}
