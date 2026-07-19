import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
  fetchFoodLogsForDate,
} from '@/lib/supabase/server'
import { fetchCoachActions } from '@/lib/coach-actions'
import { RecordDecisionButton } from '@/components/coach/RecordDecisionButton'
import { todayISO } from '@/lib/dates'
import type { Metadata } from 'next'
import type { CoachAction } from '@/lib/coach-actions'

export const metadata: Metadata = { title: 'Coach actions' }

const CATEGORY_LABELS: Record<string, string> = {
  weight: 'Weight',
  nutrition: 'Nutrition',
  training: 'Training',
  activity: 'Activity',
  general: 'General',
}

function ActionCard({
  action,
  isPrimary,
}: {
  action: CoachAction
  isPrimary: boolean
}) {
  return (
    <div
      className={`shred-card space-y-2.5 ${
        isPrimary ? 'border-primary/30' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {CATEGORY_LABELS[action.category] ?? action.category}
        </span>
        {isPrimary && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            Today’s focus
          </span>
        )}
      </div>

      <h3 className={`font-semibold text-foreground ${isPrimary ? 'text-lg' : 'text-sm'}`}>
        {action.title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed">{action.reason}</p>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Next step:</span> {action.nextStep}
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link href={action.linkHref} className="text-xs text-primary hover:underline">
          {action.linkLabel} →
        </Link>
      </div>

      {action.isRecordable && action.decisionType && (
        <div className="pt-2 border-t border-border">
          <RecordDecisionButton
            decisionType={action.decisionType}
            title={action.title}
            reason={action.reason}
          />
        </div>
      )}
    </div>
  )
}

export default async function CoachPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayISO()

  const [profile, target, todayFoodLogs] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCurrentNutritionTarget(supabase, user.id),
    fetchFoodLogsForDate(supabase, user.id, today),
  ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  // Zero new queries beyond what fetchWeeklyReview and
  // fetchNutritionCoachSummary already run individually.
  const actions = await fetchCoachActions(
    supabase, user.id, today, profile, target, todayFoodLogs
  )

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Coach actions</h1>
        <p className="text-sm text-muted-foreground">
          A short, rule-based read on what to focus on this week.
        </p>
      </div>

      {!actions.hasEnoughData && (
        <div className="shred-card text-center py-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            Week is just getting started — check back after a few more days.
          </p>
          <p className="text-xs text-muted-foreground">
            Coach actions need a few days of the week to give a reliable read.
          </p>
        </div>
      )}

      {actions.hasEnoughData && actions.primaryAction && (
        <ActionCard action={actions.primaryAction} isPrimary />
      )}

      {actions.secondaryActions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground px-1">Also worth a look</p>
          {actions.secondaryActions.map((action) => (
            <ActionCard key={action.type} action={action} isPrimary={false} />
          ))}
        </div>
      )}

      <div className="pt-2 flex items-center justify-center gap-4">
        <Link href="/check-in" className="text-xs text-primary hover:underline">
          Weekly check-in →
        </Link>
        <Link href="/decisions" className="text-xs text-primary hover:underline">
          Decisions →
        </Link>
      </div>
    </div>
  )
}
