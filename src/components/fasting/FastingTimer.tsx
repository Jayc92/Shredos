'use client'

import { useEffect, useState } from 'react'
import { addHours } from 'date-fns'
import { getFastingDuration, formatDurationHMS, getCurrentMilestone, getNextMilestone } from '@/lib/fasting'
import { formatTime } from '@/lib/dates'
import type { FastingLog } from '@/types/database'

interface FastingTimerProps {
  fast: FastingLog
}

export function FastingTimer({ fast }: FastingTimerProps) {
  const [mins, setMins] = useState(0)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    function tick() {
      const { minutes, seconds } = getFastingDuration(fast.started_at, null)
      setMins(minutes)
      setSecs(seconds)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [fast.started_at])

  const durationHours = mins / 60
  const milestone = getCurrentMilestone(durationHours)
  const nextMilestone = getNextMilestone(durationHours)

  const goalPct = fast.goal_hours
    ? Math.min(100, (mins / (fast.goal_hours * 60)) * 100)
    : null

  const goalReached = fast.goal_hours !== null && durationHours >= fast.goal_hours

  // Phase 1P: factual projected end-time, not a recommendation or claim.
  // Only shown while there's still a goal to reach — once reached, the
  // existing "✓ Reached!" indicator already covers it.
  const projectedEndTime =
    fast.goal_hours !== null && !goalReached
      ? formatTime(addHours(new Date(fast.started_at), fast.goal_hours))
      : null

  const nextMilestoneMinutesAway = nextMilestone
    ? Math.max(0, Math.round(nextMilestone.hours * 60 - mins))
    : null

  return (
    <div className="shred-card space-y-5">
      {/* Timer */}
      <div className="text-center space-y-2">
        <p className="metric-label">Active fast</p>
        <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
          {formatDurationHMS(mins, secs)}
        </p>
        {fast.goal_hours && (
          <p className="text-sm text-muted-foreground">
            Goal: {fast.goal_hours}h
            {goalReached && (
              <span className="ml-2 text-green-400 font-medium">✓ Reached!</span>
            )}
          </p>
        )}
        {projectedEndTime && (
          <p className="text-sm text-muted-foreground">
            Ends around {projectedEndTime}
          </p>
        )}
      </div>

      {/* Goal progress bar */}
      {goalPct !== null && (
        <div className="space-y-1">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">{Math.round(goalPct)}%</p>
        </div>
      )}

      {/* Current milestone */}
      {milestone && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-1">
          <p className="text-sm font-medium text-primary">{milestone.label}</p>
          <p className="text-xs text-muted-foreground">{milestone.note}</p>
        </div>
      )}

      {/* Next milestone countdown */}
      {nextMilestone && nextMilestoneMinutesAway !== null && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          <span>Next: {nextMilestone.label}</span>
          <span className="tabular-nums">
            {nextMilestoneMinutesAway >= 60
              ? `${Math.floor(nextMilestoneMinutesAway / 60)}h ${nextMilestoneMinutesAway % 60}m`
              : `${nextMilestoneMinutesAway}m`}{' '}
            away
          </span>
        </div>
      )}
    </div>
  )
}
