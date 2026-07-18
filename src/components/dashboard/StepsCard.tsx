// ============================================================
// ShredOS — StepsCard (Phase 1H)
// Replaces the prior wearable-sync placeholder with real
// manual step logging data. No wearable language remains.
// ============================================================

import { Footprints } from 'lucide-react'
import Link from 'next/link'
import type { DailyActivityLog } from '@/types/database'

interface StepsCardProps {
  stepGoal: number | null
  todayLog: DailyActivityLog | null
}

export function StepsCard({ stepGoal, todayLog }: StepsCardProps) {
  const steps = todayLog?.steps ?? 0
  const hasLoggedToday = todayLog !== null

  const pct = stepGoal ? Math.min(100, Math.round((steps / stepGoal) * 100)) : null
  const remaining = stepGoal ? Math.max(0, stepGoal - steps) : null
  const goalMet = stepGoal ? steps >= stepGoal : false

  return (
    <div className="shred-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Steps</span>
        </div>
        <Link href="/activity" className="text-xs text-primary hover:underline">
          Log steps →
        </Link>
      </div>

      {!hasLoggedToday ? (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">No steps logged yet today.</p>
          {stepGoal ? (
            <p className="text-xs text-muted-foreground">
              Goal: {stepGoal.toLocaleString()} steps
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Set a step goal in your profile to track progress.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-2xl font-bold tabular-nums">{steps.toLocaleString()}</p>
          {stepGoal ? (
            <>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {goalMet ? 'Goal met' : `${remaining!.toLocaleString()} steps to goal`}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Set a step goal in your profile to track progress.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
