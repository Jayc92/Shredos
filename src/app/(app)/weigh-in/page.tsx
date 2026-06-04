import { redirect } from 'next/navigation'
import { createClient, fetchUserProfile, fetchRecentWeighIns } from '@/lib/supabase/server'
import { WeighInForm } from '@/components/weigh-in/WeighInForm'
import { WeighInHistory } from '@/components/weigh-in/WeighInHistory'
import { getNextWeighInDate, getTrendConfidence } from '@/lib/weighIn'
import { getDayName, formatDateShort } from '@/lib/dates'
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

  const nextDate = getNextWeighInDate(
    profile.preferred_weigh_in_cadence,
    lastDate,
    profile.preferred_weigh_in_day
  )

  const confidence = getTrendConfidence(profile.preferred_weigh_in_cadence, weighIns.length)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Weigh-in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule:{' '}
          {profile.preferred_weigh_in_cadence === 'manual'
            ? 'Manual'
            : `${profile.preferred_weigh_in_cadence === 'weekly' ? 'Weekly' : 'Biweekly'} · ${getDayName(profile.preferred_weigh_in_day)} ${profile.preferred_weigh_in_time}`}
          {nextDate && ` · Next: ${formatDateShort(nextDate)}`}
        </p>
      </div>

      {/* Confidence summary bar */}
      {confidence !== 'none' && (
        <div className={`rounded-lg px-4 py-2.5 text-sm ${
          confidence === 'high'
            ? 'bg-green-500/10 text-green-400'
            : confidence === 'medium'
            ? 'bg-yellow-500/10 text-yellow-400'
            : 'bg-amber-500/10 text-amber-400'
        }`}>
          {confidence === 'high' && '✓ High confidence — enough data for trend analysis.'}
          {confidence === 'medium' && `Building confidence — ${weighIns.length} weigh-ins recorded. A few more before strong recommendations.`}
          {confidence === 'low' && `Low confidence — ${weighIns.length} weigh-in${weighIns.length !== 1 ? 's' : ''} recorded. Keep logging to unlock trend analysis.`}
        </div>
      )}

      <WeighInForm />

      <WeighInHistory weighIns={weighIns} cadence={profile.preferred_weigh_in_cadence} />
    </div>
  )
}
