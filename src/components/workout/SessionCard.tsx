import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatWorkoutDuration, workoutStatusLabel } from '@/lib/workout'
import { Card, CardContent } from '@/components/ui/card'
import type { WorkoutSession } from '@/types/database'

// Semantic state tokens (Phase 4B.6A) — labels always render text.
const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-caution-subtle text-caution border-caution/20',
  completed:   'bg-success-subtle text-success border-success/20',
  planned:     'bg-info-subtle text-info border-info/20',
  skipped:     'bg-surface-sunken text-ink-muted border-edge-subtle',
}

interface SessionCardProps {
  session: WorkoutSession
  exerciseCount?: number
}

export function SessionCard({ session, exerciseCount }: SessionCardProps) {
  const dateLabel = format(parseISO(session.workout_date), 'EEE, MMM d')
  const duration  = formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)
  const title     = session.title || 'Workout'

  return (
    <Link href={`/workouts/${session.id}`} className="block">
      <Card variant="interactive" className="gap-0 py-4">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-ink-muted">{dateLabel}</span>
            {exerciseCount !== undefined && (
              <span className="text-xs text-ink-muted">
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </span>
            )}
            {duration && <span className="text-xs text-ink-muted">{duration}</span>}
          </div>
        </div>
        <span className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0',
          STATUS_COLORS[session.status] ?? STATUS_COLORS.planned
        )}>
          {workoutStatusLabel(session)}
        </span>
      </CardContent>
      </Card>
    </Link>
  )
}
