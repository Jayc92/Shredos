import { cn } from '@/lib/utils'
import { ArrowLeftRight } from 'lucide-react'
import { ProgressBadge } from './ProgressBadge'
import { describeWeightTimeComparison } from '@/lib/workout'
import type { WeightTimeComparison } from '@/lib/weight-time-records'

// ============================================================
// ShredOS — weight_time session comparison badge (W10.5-A ruling 3)
//
// The active-workout badge for a weighted hold. A comparison that IS a
// direction (one hold dominates the other, or an exact repeat) renders
// through the shared ProgressBadge with the same wording and tokens every
// mode uses. An INCOMPARABLE pair — heavier but shorter, lighter but
// longer — is a two-dimensional trade-off, not a direction: it renders
// its own neutral pill that names both dimensions ("Heavier, shorter"),
// with a bidirectional icon and the same sunken/ink-muted tokens the
// 'same' badge uses, so it can never read as up, down or steady.
// ============================================================

interface WeightTimeComparisonBadgeProps {
  comparison: WeightTimeComparison
  previousSummary?: string
}

export function WeightTimeComparisonBadge({ comparison, previousSummary }: WeightTimeComparisonBadgeProps) {
  if (comparison === 'heavier_shorter' || comparison === 'lighter_longer') {
    return (
      <span
        title={previousSummary ? `Previous: ${previousSummary}` : undefined}
        data-comparison={comparison}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
          'bg-surface-sunken text-ink-muted border-edge'
        )}
      >
        <ArrowLeftRight className="w-3 h-3" aria-hidden="true" />
        {describeWeightTimeComparison(comparison)}
      </span>
    )
  }
  return <ProgressBadge signal={comparison} previousSummary={previousSummary} />
}
