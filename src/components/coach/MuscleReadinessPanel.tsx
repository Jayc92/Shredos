'use client'

import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { CoachSummary, FreshnessLevel } from '@/lib/workout-coach'

// ============================================================
// Phase 4B.4: presentation-only restyle — Card primitive + semantic
// state tokens replace the legacy card utility and raw palette
// classes. Data, freshness levels, ordering, tooltips, and the
// suggested-routine link are unchanged (also rendered on /workouts,
// which picks up the same visual refresh). Every chip carries its
// text label — status is never color-only.
// ============================================================

const FRESHNESS_COLORS: Record<FreshnessLevel, string> = {
  fresh:      'bg-success-subtle text-success border-success/20',
  ready:      'bg-info-subtle text-info border-info/20',
  recovering: 'bg-caution-subtle text-caution border-caution/20',
  fatigued:   'bg-critical-subtle text-critical border-critical/20',
}

const FRESHNESS_DOTS: Record<FreshnessLevel, string> = {
  fresh:      'bg-success',
  ready:      'bg-info',
  recovering: 'bg-caution',
  fatigued:   'bg-critical',
}

interface MuscleReadinessPanelProps {
  summary: CoachSummary
}

export function MuscleReadinessPanel({ summary }: MuscleReadinessPanelProps) {
  const { muscleReadiness, weekStats, hasEnoughData, topRoutine } = summary

  // Hide until there's enough data — no placeholder clutter
  if (!hasEnoughData) return null

  // UI-5A alphabetical refinement: the incoming order is the fixed
  // broad-group registry order (non-semantic; the chips are never
  // ranked by readiness), so display sorts a COPY by label. The
  // summary data, freshness calculations, and lib are untouched.
  const readinessByLabel = [...muscleReadiness].sort((a, b) =>
    a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'))

  return (
    <Card variant="status" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Muscle readiness</h2>
          <p className="text-xs text-ink-muted">
            {weekStats.sessionsThisWeek} session{weekStats.sessionsThisWeek !== 1 ? 's' : ''} · {weekStats.setsThisWeek} sets this week
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {readinessByLabel.map(m => (
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

        <p className="text-xs text-ink-muted">
          Based on days since each muscle group was last trained and this
          week&apos;s logged sets.
        </p>

        {topRoutine && (
          <div className="flex items-center justify-between border-t border-edge-subtle pt-2">
            <p className="text-xs text-ink-muted">Suggested next</p>
            <a href={`/workouts/routines/${topRoutine.id}`}
              className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline font-medium">
              {topRoutine.name}
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
