// ============================================================
// ShredOS — StepsCard (Phase 1H)
// Replaces the prior wearable-sync placeholder with real
// manual step logging data. No wearable language remains.
// ============================================================

import { ArrowRight, Footprints } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import type { DailyActivityLog } from '@/types/database'

interface StepsCardProps {
  stepGoal: number | null
  todayLog: DailyActivityLog | null
}

export function StepsCard({ stepGoal, todayLog }: StepsCardProps) {
  // Phase 5A.4: steps are nullable — a row can exist for a
  // distance-only day, so row existence no longer means steps were
  // logged. Only a non-null steps value counts (an explicit 0 is a
  // real recorded zero and still renders as one).
  const hasLoggedToday = todayLog?.steps != null
  const steps = todayLog?.steps ?? 0

  const remaining = stepGoal ? Math.max(0, stepGoal - steps) : null
  const goalMet = stepGoal ? steps >= stepGoal : false

  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-muted">Steps</span>
        </div>
        <Link href="/activity" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
          Log steps
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>

      {/* UI-1B limited adoption: the compact EmptyState reproduces the
          prior inline markup (muted title + muted support line) with
          identical copy; the ProgressBar replaces the equivalent
          hand-built h-1.5 sunken-track bar (same geometry — the fill
          token change bg-primary → bg-brand is the same computed
          color). Domain math (pct/remaining/goalMet) stays HERE. */}
      {!hasLoggedToday ? (
        <EmptyState
          mode="compact"
          title="No steps logged yet today."
          description={
            stepGoal
              ? `Goal: ${stepGoal.toLocaleString()} steps`
              : 'Set a step goal in your profile to track progress.'
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-2xl font-bold tabular-nums">{steps.toLocaleString()}</p>
          {stepGoal ? (
            <>
              <ProgressBar
                value={steps}
                max={stepGoal}
                size="sm"
                label="Steps toward goal"
              />
              <p className="text-xs text-ink-muted">
                {goalMet ? 'Goal met' : `${remaining!.toLocaleString()} steps to goal`}
              </p>
            </>
          ) : (
            <p className="text-xs text-ink-muted">
              Set a step goal in your profile to track progress.
            </p>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
