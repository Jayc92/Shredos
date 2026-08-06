'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  getFastingDuration,
  formatDurationHMS,
  formatDuration,
  getCurrentMilestone,
} from '@/lib/fasting'
import type { FastingLog } from '@/types/database'
import type { FastingWeekStats } from '@/types/app'

interface FastingCardProps {
  activeFast: FastingLog | null
  lastCompletedFast: FastingLog | null
  weekStats: FastingWeekStats
  fastingEnabled: boolean
}

/** Live fasting timer — updates every second */
function ActiveFastTimer({ fast }: { fast: FastingLog }) {
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    function tick() {
      const { minutes: m, seconds: s } = getFastingDuration(fast.started_at, null)
      setMinutes(m)
      setSeconds(s)
    }

    tick() // immediate update
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [fast.started_at])

  const hours = minutes / 60
  const milestone = getCurrentMilestone(hours)

  const goalPct = fast.goal_hours
    ? Math.min(100, (minutes / (fast.goal_hours * 60)) * 100)
    : null

  return (
    <div className="space-y-3">
      {/* Timer display */}
      <div className="text-center">
        <p className="metric-label mb-1">Active fast</p>
        <p className="text-4xl font-bold tabular-nums tracking-tight text-ink">
          {formatDurationHMS(minutes, seconds)}
        </p>
        {fast.goal_hours && (
          <p className="text-xs text-ink-muted mt-1">
            Goal: {fast.goal_hours}h
          </p>
        )}
      </div>

      {/* Goal progress bar */}
      {goalPct !== null && (
        <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${goalPct}%` }}
          />
        </div>
      )}

      {/* Milestone note */}
      {milestone && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-primary">{milestone.label}</p>
          <p className="text-xs text-ink-muted mt-0.5">{milestone.note}</p>
        </div>
      )}

      <a
        href="/fasting"
        className="block w-full text-center text-sm font-medium text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/10 transition-colors"
      >
        Manage fast →
      </a>
    </div>
  )
}

export function FastingCard({
  activeFast,
  lastCompletedFast,
  weekStats,
  fastingEnabled,
}: FastingCardProps) {
  return (
    <Card variant="status" className="gap-0 py-4">
      <CardContent className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-muted">Fasting</span>
        </div>
        {!fastingEnabled && (
          <span className="text-xs text-ink-muted">Off</span>
        )}
      </div>

      {activeFast ? (
        <ActiveFastTimer fast={activeFast} />
      ) : (
        <div className="space-y-3">
          {/* Last fast */}
          {lastCompletedFast ? (
            <div>
              <p className="metric-label">Last fast</p>
              {(() => {
                const { minutes } = getFastingDuration(
                  lastCompletedFast.started_at,
                  lastCompletedFast.ended_at
                )
                return (
                  <p className="text-2xl font-bold tabular-nums mt-1">
                    {formatDuration(minutes)}
                  </p>
                )
              })()}
              {lastCompletedFast.completed_goal !== null && (
                <p className={`text-xs mt-0.5 ${lastCompletedFast.completed_goal ? 'text-green-400' : 'text-ink-muted'}`}>
                  {lastCompletedFast.completed_goal ? '✓ Goal met' : 'Goal not reached'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No fasts recorded yet.</p>
          )}

          {/* Weekly stats */}
          {weekStats.totalCount > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-edge-subtle">
              <div>
                <p className="metric-label">This week</p>
                <p className="text-lg font-bold tabular-nums">
                  {weekStats.completedCount}/{weekStats.totalCount}
                </p>
                <p className="text-xs text-ink-muted">completed</p>
              </div>
              {weekStats.avgDurationFormatted && (
                <div>
                  <p className="metric-label">Avg duration</p>
                  <p className="text-lg font-bold">{weekStats.avgDurationFormatted}</p>
                </div>
              )}
            </div>
          )}

          <a
            href="/fasting"
            className="block w-full text-center text-sm font-medium text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/10 transition-colors"
          >
            {fastingEnabled ? 'Start a fast →' : 'Fasting log →'}
          </a>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
