'use client'

import { useEffect, useState } from 'react'
import { addHours } from 'date-fns'
import { getFastingDuration, formatDurationHMS, getCurrentMilestone, getNextMilestone } from '@/lib/fasting'
import { formatTime } from '@/lib/dates'
import { Card, CardContent } from '@/components/ui/card'
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
    <Card variant="status" className="gap-0 py-4">
      <CardContent className="space-y-5">
      {/* Timer */}
      <div className="text-center space-y-2">
        <p className="metric-label">Active fast</p>
        <p className="text-5xl font-bold tabular-nums tracking-tight text-ink">
          {formatDurationHMS(mins, secs)}
        </p>
        {fast.goal_hours && (
          <p className="text-sm text-ink-muted">
            Goal: {fast.goal_hours}h
            {goalReached && (
              <span className="ml-2 text-success font-medium">✓ Reached!</span>
            )}
          </p>
        )}
        {projectedEndTime && (
          <p className="text-sm text-ink-muted">
            Ends around {projectedEndTime}
          </p>
        )}
      </div>

      {/* Goal progress bar */}
      {goalPct !== null && (
        <div className="space-y-1">
          <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <p className="text-right text-xs text-ink-muted">{Math.round(goalPct)}%</p>
        </div>
      )}

      {/* Current milestone */}
      {milestone && (
        <div className="bg-brand-subtle border border-brand/20 rounded-lg p-3 space-y-1">
          <p className="text-sm font-medium text-ink">{milestone.label}</p>
          <p className="text-xs text-ink-muted">{milestone.note}</p>
        </div>
      )}

      {/* Next milestone countdown */}
      {nextMilestone && nextMilestoneMinutesAway !== null && (
        <div className="flex items-center justify-between text-xs text-ink-muted bg-surface-sunken rounded-lg px-3 py-2">
          <span>Next: {nextMilestone.label}</span>
          <span className="tabular-nums">
            {nextMilestoneMinutesAway >= 60
              ? `${Math.floor(nextMilestoneMinutesAway / 60)}h ${nextMilestoneMinutesAway % 60}m`
              : `${nextMilestoneMinutesAway}m`}{' '}
            away
          </span>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
