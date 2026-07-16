'use client'

import { cn } from '@/lib/utils'
import type { CoachSummary, FreshnessLevel } from '@/lib/workout-coach'

const FRESHNESS_COLORS: Record<FreshnessLevel, string> = {
  fresh:      'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
  ready:      'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400',
  recovering: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  fatigued:   'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
}

const FRESHNESS_DOTS: Record<FreshnessLevel, string> = {
  fresh:      'bg-green-500',
  ready:      'bg-blue-500',
  recovering: 'bg-amber-500',
  fatigued:   'bg-red-500',
}

interface MuscleReadinessPanelProps {
  summary: CoachSummary
}

export function MuscleReadinessPanel({ summary }: MuscleReadinessPanelProps) {
  const { muscleReadiness, weekStats, hasEnoughData, topRoutine } = summary

  // Hide until there's enough data — no placeholder clutter
  if (!hasEnoughData) return null

  return (
    <div className="shred-card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Muscle readiness</p>
        <p className="text-xs text-muted-foreground">
          {weekStats.sessionsThisWeek} session{weekStats.sessionsThisWeek !== 1 ? 's' : ''} · {weekStats.setsThisWeek} sets this week
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {muscleReadiness.map(m => (
          <span
            key={m.muscle}
            title={
              m.lastTrainedDaysAgo === null
                ? `${m.label}: never trained · ${m.setsThisWeek} sets this week`
                : `${m.label}: trained ${m.lastTrainedDaysAgo} day${m.lastTrainedDaysAgo !== 1 ? 's' : ''} ago · ${m.setsThisWeek} sets this week`
            }
            className={cn(
              'inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 font-medium',
              FRESHNESS_COLORS[m.freshness]
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', FRESHNESS_DOTS[m.freshness])} aria-hidden="true" />
            {m.label}
          </span>
        ))}
      </div>

      {topRoutine && (
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Suggested next</p>
          <a href={`/workouts/routines/${topRoutine.id}`}
            className="text-xs text-primary hover:underline font-medium">
            {topRoutine.name} →
          </a>
        </div>
      )}
    </div>
  )
}
