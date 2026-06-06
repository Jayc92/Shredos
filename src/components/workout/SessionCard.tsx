import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatWorkoutDuration } from '@/lib/workout'
import { WORKOUT_STATUS_LABELS } from '@/lib/constants'
import type { WorkoutSession } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  completed:   'bg-green-500/15 text-green-400 border-green-500/20',
  planned:     'bg-blue-500/15 text-blue-400 border-blue-500/20',
  skipped:     'bg-secondary text-muted-foreground border-border',
}

interface SessionCardProps {
  session: WorkoutSession
  exerciseCount?: number
}

export function SessionCard({ session, exerciseCount }: SessionCardProps) {
  const dateLabel = format(parseISO(session.workout_date), 'EEE, MMM d')
  const duration  = formatWorkoutDuration(session.start_time, session.end_time)
  const title     = session.title || 'Workout'

  return (
    <Link href={`/workouts/${session.id}`}
      className="block shred-card hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{dateLabel}</span>
            {exerciseCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </span>
            )}
            {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
          </div>
        </div>
        <span className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0',
          STATUS_COLORS[session.status] ?? STATUS_COLORS.planned
        )}>
          {WORKOUT_STATUS_LABELS[session.status] ?? session.status}
        </span>
      </div>
    </Link>
  )
}
