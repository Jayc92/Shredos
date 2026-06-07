import { Dumbbell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { formatWorkoutDuration } from '@/lib/workout'
import type { WorkoutWeekStats } from '@/types/app'

interface WorkoutCardProps {
  stats: WorkoutWeekStats
}

export function WorkoutCard({ stats }: WorkoutCardProps) {
  const { sessions_this_week, last_session, last_session_exercise_count } = stats

  return (
    <div className="shred-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Workouts</span>
        </div>
        <a href="/workouts" className="text-xs text-primary hover:underline">
          {last_session?.status === 'in_progress' ? 'Continue →' : 'Log workout →'}
        </a>
      </div>

      {last_session ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {last_session.title || 'Workout'}
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>{format(parseISO(last_session.workout_date), 'EEE, MMM d')}</span>
            {last_session_exercise_count > 0 && (
              <span>{last_session_exercise_count} exercise{last_session_exercise_count !== 1 ? 's' : ''}</span>
            )}
            {(() => {
              const dur = formatWorkoutDuration(last_session.start_time, last_session.end_time)
              return dur ? <span>{dur}</span> : null
            })()}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No workouts yet.</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">
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
            <span className="text-xs text-muted-foreground ml-0.5">+</span>
          )}
        </div>
      </div>
    </div>
  )
}
