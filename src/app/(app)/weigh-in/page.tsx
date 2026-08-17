import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient, fetchUserProfile, fetchRecentWeighIns } from '@/lib/supabase/server'
import { WeighInForm } from '@/components/weigh-in/WeighInForm'
import { WeighInHistory } from '@/components/weigh-in/WeighInHistory'
import { WeighInSummary } from '@/components/weigh-in/WeighInSummary'
import { BodyMeasurementsSummary } from '@/components/weigh-in/BodyMeasurementsSummary'
import { WeightTrendSection } from '@/components/weigh-in/WeightTrendSection'
import { buildWeightTrendSummary } from '@/lib/weight-trends'
import { getNextWeighInDate, getTrendConfidence } from '@/lib/weighIn'
import { computeWeightProgress } from '@/lib/progress-summary'
import { cmToInches } from '@/lib/units'
import { getDayName, formatDateShort } from '@/lib/dates'
import { localTodayFromCookies } from '@/lib/local-date-server'
import { subDays, format, parseISO } from 'date-fns'
import { ProgressSubNav } from '@/components/progress/ProgressSubNav'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weigh-in' }

export default async function WeighInPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, weighIns] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchRecentWeighIns(supabase, user.id, 50),
  ])

  if (!profile) redirect('/onboarding')

  const lastDate = weighIns[0]?.logged_date
    ? new Date(weighIns[0].logged_date + 'T00:00:00')
    : null

  // Local-date fix: with no prior weigh-in the lib would fall back
  // to new Date() — the UTC day on the server. Pass the user's local
  // day explicitly so the fallback never fires server-side.
  const nextDate = getNextWeighInDate(
    profile.preferred_weigh_in_cadence,
    lastDate ?? new Date(localTodayFromCookies() + 'T00:00:00'),
    profile.preferred_weigh_in_day
  )

  const confidence = getTrendConfidence(profile.preferred_weigh_in_cadence, weighIns.length)

  // Phase 2Y: 7-day averages + 28-day chart, derived from the SAME
  // already-fetched weighIns array (no new query; the existing
  // 50-row fetch bound is unchanged). Trend math deduplicates to one
  // entry per calendar date internally — the stored records and the
  // visible history below are untouched.
  const weightTrend = buildWeightTrendSummary(weighIns, profile.goal_weight_kg)

  // Phase 1L: 28-day summary, derived from the already-fetched weighIns
  // array (no new query). computeWeightProgress is the exact same helper
  // /progress uses for its own 4-week rollup — reused here rather than
  // reimplementing the same trend math a third time.
  // Local-date fix: the user's calendar day, not the server's UTC day.
  const today = localTodayFromCookies()
  const windowStart = format(subDays(parseISO(today), 27), 'yyyy-MM-dd')
  const last28DayMetrics = weighIns
    .filter(
      (w) => w.weight_kg !== null && w.logged_date >= windowStart && w.logged_date <= today
    )
    .map((w) => ({ logged_date: w.logged_date, weight_kg: w.weight_kg as number }))
    .sort((a, b) => a.logged_date.localeCompare(b.logged_date))
  const weightProgress = computeWeightProgress(last28DayMetrics)

  // Phase 1M: waist summary, derived from the same already-fetched
  // weighIns array and the same 28-day window computed above — no new
  // query. Independently filtered on waist_cm, since a row can have
  // weight without waist (waist is optional) or, in principle, be
  // missing either field.
  const allWaistEntries = weighIns
    .filter((w) => w.waist_cm !== null)
    .map((w) => ({ logged_date: w.logged_date, waist_cm: w.waist_cm as number }))
    .sort((a, b) => a.logged_date.localeCompare(b.logged_date))

  const waistEntriesLast28Days = allWaistEntries.filter(
    (w) => w.logged_date >= windowStart && w.logged_date <= today
  )

  const totalWaistCount = allWaistEntries.length
  const waistCountLast28Days = waistEntriesLast28Days.length

  const latestWaistEntry = allWaistEntries[allWaistEntries.length - 1] ?? null
  const previousWaistEntry =
    allWaistEntries.length >= 2 ? allWaistEntries[allWaistEntries.length - 2] : null

  const latestWaistIn = latestWaistEntry ? cmToInches(latestWaistEntry.waist_cm) : null
  const deltaFromPreviousIn =
    latestWaistEntry && previousWaistEntry
      ? Math.round((cmToInches(latestWaistEntry.waist_cm) - cmToInches(previousWaistEntry.waist_cm)) * 10) / 10
      : null

  const first28DayWaistEntry = waistEntriesLast28Days[0] ?? null
  const latest28DayWaistEntry = waistEntriesLast28Days[waistEntriesLast28Days.length - 1] ?? null
  const delta28DayIn =
    waistCountLast28Days >= 2 && first28DayWaistEntry && latest28DayWaistEntry
      ? Math.round(
          (cmToInches(latest28DayWaistEntry.waist_cm) - cmToInches(first28DayWaistEntry.waist_cm)) * 10
        ) / 10
      : null

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Weigh-in</h1>
        <p className="text-sm text-ink-muted mt-1">
          Schedule:{' '}
          {profile.preferred_weigh_in_cadence === 'manual'
            ? 'Manual'
            : `${profile.preferred_weigh_in_cadence === 'weekly' ? 'Weekly' : 'Biweekly'} · ${getDayName(profile.preferred_weigh_in_day)} ${profile.preferred_weigh_in_time}`}
          {nextDate && ` · Next: ${formatDateShort(nextDate)}`}
        </p>
      </div>

      <ProgressSubNav fastingEnabled={profile.fasting_enabled} />

      {/* Evidence-coverage bar — same thresholds and copy, semantic
          state tokens (coverage statement, not a performance score). */}
      {confidence !== 'none' && (
        <div className={`rounded-lg px-4 py-2.5 text-sm ${
          confidence === 'high'
            ? 'bg-success-subtle text-success'
            : confidence === 'medium'
            ? 'bg-info-subtle text-info'
            : 'bg-caution-subtle text-caution'
        }`}>
          {confidence === 'high' && (
            <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />High confidence — enough data for trend analysis.</span>
          )}
          {confidence === 'medium' && `Building confidence — ${weighIns.length} weigh-ins recorded. A few more before strong recommendations.`}
          {confidence === 'low' && `Low confidence — ${weighIns.length} weigh-in${weighIns.length !== 1 ? 's' : ''} recorded. Keep logging to unlock trend analysis.`}
        </div>
      )}

      {/* Upper two-column area at lg: log form beside the latest/
          trend summary. One column below lg. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeighInForm />

        {/* Phase 2Y: trend summary + 28-day chart, after the entry
            form and before the existing 28-day summary block. */}
        <WeightTrendSection summary={weightTrend} />
      </div>

      <WeighInSummary summary={weightProgress} userGoal={profile.main_goal} />

      <BodyMeasurementsSummary
        latestWaistIn={latestWaistIn}
        deltaFromPreviousIn={deltaFromPreviousIn}
        delta28DayIn={delta28DayIn}
        totalWaistCount={totalWaistCount}
        waistCountLast28Days={waistCountLast28Days}
      />

      <WeighInHistory
        weighIns={weighIns}
        cadence={profile.preferred_weigh_in_cadence}
        userGoal={profile.main_goal}
      />
    </div>
  )
}
