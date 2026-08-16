import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
  fetchFoodLogsForDate,
} from '@/lib/supabase/server'
import { fetchCoachActions } from '@/lib/coach-actions'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { RecordDecisionButton } from '@/components/coach/RecordDecisionButton'
import { CoachSubNav } from '@/components/coach/CoachSubNav'
import { MuscleReadinessPanel } from '@/components/coach/MuscleReadinessPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Notice } from '@/components/ui/notice'
import { localTodayFromCookies } from '@/lib/local-date-server'
import type { Metadata } from 'next'
import type { CoachAction } from '@/lib/coach-actions'

export const metadata: Metadata = { title: 'Coach' }

// ============================================================
// ForgeFitOS — Coach (Phase 4B.4 redesign)
//
// Current-week guidance and next actions. Hierarchy: header +
// pillar subnav → primary action (the EXISTING first action from
// buildCoachActions — never reselected or reprioritized here) →
// secondary actions in existing order → muscle readiness context →
// distinguished empty/unavailable states.
//
// Every threshold, priority, action link, and RecordDecisionButton
// behavior is unchanged — this is presentation only. The ONE data
// addition on this route: MuscleReadinessPanel (a components/coach
// audit item that previously rendered only on /workouts) now also
// gives the Coach route its readiness context, via the SAME existing
// fetchCoachSummary helper the dashboard and workouts pages already
// use. No new readiness calculation, display-only.
//
// State separation (core principle): observed data (readiness,
// week stats) vs system suggestion (action cards) vs user decision
// (explicit RecordDecisionButton — nothing is inserted
// automatically).
// ============================================================

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
    <Card variant={isPrimary ? 'action' : 'default'} className="gap-0 py-4">
      <CardContent className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-muted">
            {CATEGORY_LABELS[action.category] ?? action.category}
          </span>
          {isPrimary && (
            <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-ink">
              Primary action
            </span>
          )}
        </div>

        <h3 className={`font-semibold text-ink ${isPrimary ? 'text-lg' : 'text-sm'}`}>
          {action.title}
        </h3>

        <p className="text-sm leading-relaxed text-ink-muted">{action.reason}</p>

        <p className="text-xs text-ink-muted">
          <span className="font-medium text-ink">Next step:</span> {action.nextStep}
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link href={action.linkHref} className="text-xs text-brand hover:underline">
            {action.linkLabel} →
          </Link>
        </div>

        {action.isRecordable && action.decisionType && (
          <div className="border-t border-edge-subtle pt-2">
            <RecordDecisionButton
              decisionType={action.decisionType}
              title={action.title}
              reason={action.reason}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function CoachPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Local-date fix: the user's calendar day, not the server's UTC day.
  const today = localTodayFromCookies()

  const [profile, target, todayFoodLogs] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCurrentNutritionTarget(supabase, user.id),
    fetchFoodLogsForDate(supabase, user.id, today),
  ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  // Zero new queries beyond what fetchWeeklyReview and
  // fetchNutritionCoachSummary already run individually — plus the
  // existing fetchCoachSummary helper for the readiness context.
  const [actions, coachSummary] = await Promise.all([
    fetchCoachActions(supabase, user.id, today, profile, target, todayFoodLogs),
    fetchCoachSummary(supabase, user.id, today),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Coach</h1>
        <p className="text-sm text-ink-muted">
          A short, rule-based read on what to focus on this week, based on this
          week&apos;s available data.
        </p>
      </div>

      <CoachSubNav />

      {/* Insufficient evidence — visibly a data-coverage state, never
          a success claim. */}
      {!actions.hasEnoughData && (
        <Notice variant="info" title="Evidence is still building">
          Coach actions need a few days of the week to give a reliable read —
          check back after a few more days of logging.
        </Notice>
      )}

      {/* Valid week with no actions — distinct from the insufficient
          state above: enough evidence exists, and nothing needs
          attention right now. */}
      {actions.hasEnoughData && !actions.primaryAction && (
        <Card variant="status" className="gap-0 py-6">
          <CardContent className="space-y-1 text-center">
            <p className="text-sm font-medium text-ink">
              No suggested actions for this week.
            </p>
            <p className="text-xs text-ink-muted">
              Based on this week&apos;s available data. Keep logging as usual.
            </p>
          </CardContent>
        </Card>
      )}

      {actions.hasEnoughData && actions.primaryAction && (
        <ActionCard action={actions.primaryAction} isPrimary />
      )}

      {actions.secondaryActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-ink-muted">
            Also worth a look
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {actions.secondaryActions.map((action) => (
              <ActionCard key={action.type} action={action} isPrimary={false} />
            ))}
          </div>
        </div>
      )}

      {/* Observed training context — existing data, no prescription. */}
      <MuscleReadinessPanel summary={coachSummary} />

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link href="/progress" className="text-xs text-brand hover:underline">
          Progress →
        </Link>
      </div>
    </div>
  )
}
