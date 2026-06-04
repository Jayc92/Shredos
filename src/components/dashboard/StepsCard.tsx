// StepsCard
import { Footprints } from 'lucide-react'

interface StepsCardProps {
  stepGoal: number
}

export function StepsCard({ stepGoal }: StepsCardProps) {
  return (
    <div className="shred-card space-y-3">
      <div className="flex items-center gap-2">
        <Footprints className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Steps</span>
      </div>

      <div>
        <p className="metric-label">Daily goal</p>
        <p className="metric-value mt-1">{stepGoal.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">steps</p>
      </div>

      <div className="h-1.5 bg-secondary rounded-full">
        <div className="h-full w-0 bg-green-500 rounded-full" />
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Manual step entry and wearable sync coming in Phase 1B / Phase 3.
        </p>
      </div>
    </div>
  )
}
