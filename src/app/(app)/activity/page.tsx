import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchActivityLogForDate,
  fetchActivityLogsForRange,
  fetchRecentActivitySessions,
  fetchActivitySessionsForDate,
} from '@/lib/supabase/server'
import {
  sessionDistanceTotalMeters,
  dailyDistanceReconciliationWarning,
} from '@/lib/activity'
import { ActivityLogForm } from '@/components/activity/ActivityLogForm'
import { AddActivityForm } from '@/components/activity/AddActivityForm'
import { ActivitySessionList } from '@/components/activity/ActivitySessionList'
import { todayISO } from '@/lib/dates'
import { averageDailySteps } from '@/lib/weekly-review'
import { format, addDays, subDays, parseISO, isToday, isFuture } from 'date-fns'
import { ProgressSubNav } from '@/components/progress/ProgressSubNav'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Activity' }

/** Date navigation — same pattern as /food, server component only */
function DateNav({ date }: { date: string }) {
  const current = parseISO(date)
  const prev = format(addDays(current, -1), 'yyyy-MM-dd')
  const next = format(addDays(current, 1), 'yyyy-MM-dd')
  const isCurrentToday = isToday(current)
  const isNextFuture = isFuture(addDays(current, 1)) && !isToday(addDays(current, 1))

  return (
    <div className="flex items-center justify-between">
      <Link
        href={`/activity?date=${prev}`}
        className="p-2 rounded-lg hover:bg-surface-interactive transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      <div className="text-center">
        <p className="text-base font-semibold text-ink">
          {isCurrentToday ? 'Today' : format(current, 'EEEE, MMMM d')}
        </p>
        {!isCurrentToday && (
          <Link href="/activity" className="text-xs text-brand hover:underline">
            Back to today
          </Link>
        )}
      </div>

      <Link
        href={isNextFuture ? '#' : `/activity?date=${next}`}
        className={`p-2 rounded-lg transition-colors ${
          isNextFuture ? 'opacity-30 pointer-events-none' : 'hover:bg-surface-interactive'
        }`}
        aria-label="Next day"
        aria-disabled={isNextFuture}
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  )
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = todayISO()
  const date = searchParams.date ?? todayStr
  const isFutureDate = date > todayStr

  const sevenDaysAgo = format(subDays(parseISO(todayStr), 6), 'yyyy-MM-dd')

  const [profile, existingLog, recentLogs, activitySessions, sessionsForDate] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchActivityLogForDate(supabase, user.id, date),
    fetchActivityLogsForRange(supabase, user.id, sevenDaysAgo, todayStr),
    fetchRecentActivitySessions(supabase, user.id, 10),
    fetchActivitySessionsForDate(supabase, user.id, date),
  ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  const stepGoal = profile.step_goal ?? null

  // 7-day summary — always reflects the trailing week ending today
  // (today + previous 6 local calendar days), independent of which
  // date is being viewed/edited above. The average is the
  // authoritative rule: total / 7 with missing days as zero — never
  // an average of logged days only (Phase 5A.3 QA correction).
  // Phase 5A.4: steps are nullable — a distance-only day is NOT a
  // step-logged day, and NULL steps contribute zero to the sum.
  const loggedDays = recentLogs.filter((l) => l.steps !== null).length
  const avgSteps =
    loggedDays > 0
      ? averageDailySteps(recentLogs.reduce((s, l) => s + (l.steps ?? 0), 0))
      : null
  const goalDaysHit = stepGoal
    ? recentLogs.filter((l) => l.steps !== null && l.steps >= stepGoal).length
    : null

  // Aggregate-vs-component reconciliation for the VIEWED date:
  // intentional session distance is a component of (not an addition
  // to) the daily total, so exceeding it earns an informational
  // warning — never a block, never a mutation of either value.
  const distanceWarning = dailyDistanceReconciliationWarning(
    existingLog?.distance_meters ?? null,
    sessionDistanceTotalMeters(sessionsForDate)
  )

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Activity</h1>
      </div>

      <ProgressSubNav fastingEnabled={profile.fasting_enabled} />

      <DateNav date={date} />

      {/* key={date}: each calendar day gets its OWN form instance.
          Without it, React reuses the same-position component across
          ?date= navigations and the useState(existingLog) initializer
          never re-runs — the previous date's value follows the user
          and, if saved, is written to the newly selected date
          (physical-QA defect, empirically reproduced). Remounting per
          date reinitializes state from that date's server-fetched
          row. */}
      <ActivityLogForm key={date} date={date} existingLog={existingLog} isFutureDate={isFutureDate} />

      {distanceWarning && (
        <p className="text-xs text-ink-muted bg-surface-sunken rounded-lg px-3 py-2">
          {distanceWarning}
        </p>
      )}

      {stepGoal && (
        <p className="text-xs text-ink-muted text-center">
          Daily goal: {stepGoal.toLocaleString()} steps
        </p>
      )}

      {/* Last 7 days — authoritative SUM/7 average (5A.3 correction);
          "days logged" counts step-recorded days only */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Last 7 days</h2>
        {loggedDays === 0 ? (
          <p className="text-sm text-ink-muted">No steps logged this week yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{loggedDays}/7</p>
              <p className="text-xs text-ink-muted mt-0.5">days logged</p>
            </div>
            <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
              <p className="text-base font-bold tabular-nums">
                {avgSteps !== null ? avgSteps.toLocaleString() : '—'}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">7-day avg</p>
            </div>
            <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
              <p className="text-base font-bold tabular-nums">
                {goalDaysHit !== null ? goalDaysHit : '—'}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">goal days</p>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Phase 5A.3: intentional activity sessions — deliberate
          walks/runs etc., strictly separate from the passive daily
          steps above. Sessions never feed the step totals and their
          calories are informational only. */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Intentional activity</h2>
        <AddActivityForm />
        <ActivitySessionList sessions={activitySessions} />
      </section>
    </div>
  )
}
