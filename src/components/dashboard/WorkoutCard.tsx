import { Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'
import { formatWorkoutDuration } from '@/lib/workout'
import type { WorkoutWeekStats } from '@/types/app'

interface WorkoutCardProps {
  stats: WorkoutWeekStats
}

export function WorkoutCard({ stats }: WorkoutCardProps) {
  const { sessions_this_week, last_session, last_session_exercise_count, active_routine_count } = stats

  return (
    <Card variant="elevated" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-muted">Workouts</span>
        </div>
        <a href="/workouts" className="text-xs text-brand hover:underline">
          {last_session?.status === 'in_progress' ? 'Continue →' : 'Log workout →'}
        </a>
      </div>

      {last_session ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">
            {last_session.title || 'Workout'}
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
            <span>{format(parseISO(last_session.workout_date), 'EEE, MMM d')}</span>
            {last_session_exercise_count > 0 && (
              <span>{last_session_exercise_count} exercise{last_session_exercise_count !== 1 ? 's' : ''}</span>
            )}
            {(() => {
              const dur = formatWorkoutDuration(last_session.start_time, last_session.end_time, last_session.completed_duration_seconds)
              return dur ? <span>{dur}</span> : null
            })()}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No workouts yet.</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-edge-subtle">
        <span className="text-xs text-ink-muted">
          {sessions_this_week} session{sessions_this_week !== 1 ? 's' : ''} this week
        </span>
        {/* Dots capped at 5 — text count is the source of truth for >5 */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${
              i < Math.min(sessions_this_week, 5) ? 'bg-primary' : 'bg-secondary'
            }`} />
          ))}
          {sessions_this_week > 5 && (
            <span className="text-xs text-ink-muted ml-0.5">+</span>
          )}
        </div>
      </div>
      {/* Phase 1D: routine count + start link */}
      {active_routine_count > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-edge-subtle">
          <span className="text-xs text-ink-muted">
            {active_routine_count} routine{active_routine_count !== 1 ? 's' : ''} saved
          </span>
          <a href="/workouts/routines" className="text-xs text-brand hover:underline">
            Start a routine →
          </a>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
