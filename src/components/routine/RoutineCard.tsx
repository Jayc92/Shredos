import Link from 'next/link'
import { formatRoutineTarget, goalLabel, muscleFocusLabel } from '@/lib/routine'
import { cn } from '@/lib/utils'
import type { WorkoutRoutine } from '@/types/database'

interface RoutineCardProps {
  routine: WorkoutRoutine & { workout_routine_exercises?: { id: string }[] }
}

export function RoutineCard({ routine }: RoutineCardProps) {
  const exerciseCount = routine.workout_routine_exercises?.length ?? 0
  const goal = goalLabel(routine.goal)
  const focus = muscleFocusLabel(routine.primary_muscle_focus)

  return (
    <Link href={`/workouts/routines/${routine.id}`}
      className={cn('block shred-card hover:border-border/80 transition-colors', !routine.is_active && 'opacity-50')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{routine.name}</p>
            {!routine.is_active && (
              <span className="text-xs bg-secondary text-muted-foreground rounded px-1.5 py-0.5">Inactive</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {exerciseCount > 0 && <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>}
            {goal && <span className="rounded-full border border-border px-2 py-0.5">{goal}</span>}
            {focus && <span className="rounded-full border border-border px-2 py-0.5">{focus}</span>}
            {routine.estimated_duration_minutes && <span>~{routine.estimated_duration_minutes} min</span>}
          </div>
          {routine.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{routine.description}</p>
          )}
        </div>
        <span className="text-muted-foreground text-xs flex-shrink-0 mt-0.5">›</span>
      </div>
    </Link>
  )
}
