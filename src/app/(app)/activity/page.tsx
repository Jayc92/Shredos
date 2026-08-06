import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchActivityLogForDate,
  fetchActivityLogsForRange,
} from '@/lib/supabase/server'
import { ActivityLogForm } from '@/components/activity/ActivityLogForm'
import { todayISO } from '@/lib/dates'
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

  const [profile, existingLog, recentLogs] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchActivityLogForDate(supabase, user.id, date),
    fetchActivityLogsForRange(supabase, user.id, sevenDaysAgo, todayStr),
  ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  const stepGoal = profile.step_goal ?? null

  // 7-day summary — always reflects the trailing week ending today,
  // independent of which date is being viewed/edited above.
  const loggedDays = recentLogs.length
  const avgSteps =
    loggedDays > 0
      ? Math.round(recentLogs.reduce((s, l) => s + l.steps, 0) / loggedDays)
      : null
  const goalDaysHit = stepGoal
    ? recentLogs.filter((l) => l.steps >= stepGoal).length
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Activity</h1>
      </div>

      <ProgressSubNav fastingEnabled={profile.fasting_enabled} />

      <DateNav date={date} />

      <ActivityLogForm date={date} existingLog={existingLog} isFutureDate={isFutureDate} />

      {stepGoal && (
        <p className="text-xs text-ink-muted text-center">
          Daily goal: {stepGoal.toLocaleString()} steps
        </p>
      )}

      {/* Last 7 days — logged-days-only average, consistent with Phase 1F/1G */}
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
              <p className="text-xs text-ink-muted mt-0.5">avg steps</p>
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
    </div>
  )
}
