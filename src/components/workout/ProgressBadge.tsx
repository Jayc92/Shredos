import { cn } from '@/lib/utils'
import { progressLabel, progressColor } from '@/lib/workout'
import type { ProgressSignal } from '@/types/app'

interface ProgressBadgeProps {
  signal: ProgressSignal
  previousSummary?: string
}

export function ProgressBadge({ signal, previousSummary }: ProgressBadgeProps) {
  return (
    <span
      title={previousSummary ? `Previous: ${previousSummary}` : undefined}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        progressColor(signal)
      )}
    >
      {progressLabel(signal)}
    </span>
  )
}
