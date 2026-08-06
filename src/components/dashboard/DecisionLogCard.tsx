import { ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelativeDate } from '@/lib/dates'
import { DECISION_STATUS_LABELS } from '@/lib/constants'
import type { DecisionLog } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  suggested: 'text-amber-400 bg-amber-400/10',
  accepted: 'text-green-400 bg-green-400/10',
  dismissed: 'text-ink-muted bg-secondary',
  applied: 'text-blue-400 bg-blue-400/10',
  reversed: 'text-red-400 bg-red-400/10',
}

interface DecisionLogCardProps {
  decision: DecisionLog | null
}

export function DecisionLogCard({ decision }: DecisionLogCardProps) {
  return (
    <Card variant="subtle" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-muted">Latest decision</span>
        </div>
        <a href="/decisions" className="text-xs text-brand hover:underline">
          View all
        </a>
      </div>

      {decision ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-ink leading-snug">
              {decision.decision_title}
            </p>
            <span
              className={`text-xs font-medium rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0 ${
                STATUS_COLORS[decision.status] ?? ''
              }`}
            >
              {DECISION_STATUS_LABELS[decision.status] ?? decision.status}
            </span>
          </div>
          <p className="text-xs text-ink-muted">{decision.decision_summary}</p>
          <p className="text-xs text-ink-muted">
            {formatRelativeDate(decision.created_at)} ·{' '}
            {decision.created_by === 'system' ? 'System' : decision.created_by === 'coach' ? 'Coach' : 'You'}
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink-muted py-2">
          No decisions recorded yet. Complete onboarding to see your first entry.
        </p>
      )}
      </CardContent>
    </Card>
  )
}
