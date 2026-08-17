'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressRing } from '@/components/ui/progress-ring'
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

  // UI-2: the goal visualization is the domain-blind ProgressRing.
  // ALL fasting arithmetic stays here — the ring receives raw
  // elapsed/goal minutes and does only presentation clamping. The
  // goal-minute conversion below is the same fast.goal_hours * 60
  // the old bar used.
  const goalMinutes = fast.goal_hours ? fast.goal_hours * 60 : null

  return (
    <div className="space-y-3">
      {/* Timer display with the goal ring beside it */}
      <div className="flex items-center justify-center gap-4">
        {goalMinutes !== null && (
          <ProgressRing
            value={minutes}
            max={goalMinutes}
            size={64}
            strokeWidth={5}
            label="Fast progress toward goal"
          />
        )}
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
      </div>

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
        <span className="inline-flex items-center gap-1">Manage fast <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
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
                  {lastCompletedFast.completed_goal ? (
                    <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" aria-hidden="true" />Goal met</span>
                  ) : 'Goal not reached'}
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
            <span className="inline-flex items-center gap-1">{fastingEnabled ? 'Start a fast' : 'Fasting log'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
          </a>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
