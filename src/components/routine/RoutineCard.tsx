import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatRoutineTarget, goalLabel, muscleFocusLabel } from '@/lib/routine'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
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
      className={cn('block', !routine.is_active && 'opacity-50')}>
      <Card variant="interactive" className="gap-0 py-4">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* UI-5A: long routine names wrap instead of truncating. */}
            <p className="min-w-0 break-words text-sm font-semibold text-ink">{routine.name}</p>
            {!routine.is_active && (
              <span className="text-xs bg-surface-sunken text-ink-muted rounded px-1.5 py-0.5">Inactive</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
            {exerciseCount > 0 && <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>}
            {goal && <span className="rounded-full border border-edge-subtle px-2 py-0.5">{goal}</span>}
            {focus && <span className="rounded-full border border-edge-subtle px-2 py-0.5">{focus}</span>}
            {routine.estimated_duration_minutes && <span>~{routine.estimated_duration_minutes} min</span>}
          </div>
          {routine.description && (
            <p className="text-xs text-ink-muted mt-1 line-clamp-1">{routine.description}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-ink-muted" aria-hidden="true" />
      </CardContent>
      </Card>
    </Link>
  )
}
