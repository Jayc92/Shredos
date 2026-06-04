import { Dumbbell } from 'lucide-react'

export function WorkoutCard() {
  return (
    <div className="shred-card space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Workout</span>
      </div>

      <div className="py-4 text-center space-y-2">
        <p className="text-muted-foreground text-sm">Workout planner</p>
        <p className="text-xs text-muted-foreground">
          Exercise library, workout plans, and lift logging arrive in Phase 1C.
        </p>
      </div>
    </div>
  )
}
