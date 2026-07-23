// ============================================================
// ShredOS — Weigh-in 28-day Summary (Phase 1L)
// Read-only card showing the same 4-week weight window /progress
// already computes for its own rollup — this reuses that exact
// helper (computeWeightProgress) rather than reimplementing trend
// math a third time. No new queries: the caller passes in a slice
// of the already-fetched recent weigh-ins.
// ============================================================

import { getGoalAwareWeightChangeFraming } from '@/lib/weighIn'
import type { WeightProgress } from '@/lib/progress-summary'

interface WeighInSummaryProps {
  summary: WeightProgress
  userGoal: string | null
}

export function WeighInSummary({ summary, userGoal }: WeighInSummaryProps) {
  const { weighInCount, deltaLbs, trend } = summary

  // Phase 1W: previously rendered its own "No weigh-ins logged in the
  // last 28 days" message here, which duplicated WeighInHistory's own
  // empty state immediately below it on the page for a first-time
  // user. Render nothing instead — WeighInHistory already carries the
  // actionable "log your first weigh-in above" message for that case.
  if (weighInCount === 0) {
    return null
  }

  if (trend === 'insufficient-data') {
    return (
      <div className="shred-card space-y-2">
        <h3 className="text-sm font-medium text-foreground">Last 28 days</h3>
        <p className="text-sm text-muted-foreground">
          {weighInCount} weigh-in{weighInCount !== 1 ? 's' : ''} logged — log one more
          to see a trend.
        </p>
      </div>
    )
  }

  // trend is 'down' | 'up' | 'stable' here — map to WeightChange's
  // 'down' | 'up' | 'same' shape shared with the per-entry framing helper.
  const direction = trend === 'down' ? 'down' : trend === 'up' ? 'up' : 'same'
  const { color, note } = getGoalAwareWeightChangeFraming(direction, userGoal)

  const deltaLabel = deltaLbs !== null ? `${deltaLbs > 0 ? '+' : ''}${deltaLbs} lbs` : '—'

  return (
    <div className="shred-card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Last 28 days</h3>
        <span className={`text-xs font-medium ${color}`}>{note}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tabular-nums">{deltaLabel}</span>
        <span className="text-sm text-muted-foreground">
          {weighInCount} weigh-in{weighInCount !== 1 ? 's' : ''} in the last 28 days
        </span>
      </div>
    </div>
  )
}
