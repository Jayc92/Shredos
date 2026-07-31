import { format, parseISO } from 'date-fns'
import { formatTrackingAwareSetSummary } from '@/lib/workout'
import type { ExerciseHistoryEntry } from '@/lib/workout'
import type { TrackingMode } from '@/types/database'

interface ExerciseHistoryRowsProps {
  entries?: ExerciseHistoryEntry[]
  isUnilateral?: boolean
  trackingMode: TrackingMode
}

/**
 * Compact "last few sessions" history for one exercise (Phase 2B,
 * made tracking-aware in Phase 2T). Renders nothing if there's no
 * history yet — Phase 2A's own "Log a working set to start tracking
 * targets." message already covers that case, so this component
 * doesn't add a second one. No chart, no expand/collapse — up to 3
 * rows, always visible when present, matching the same compact-text
 * approach already established for the Last/Try lines above it.
 */
export function ExerciseHistoryRows({ entries, isUnilateral, trackingMode }: ExerciseHistoryRowsProps) {
  if (!entries || entries.length === 0) return null

  return (
    <div className="pl-6 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">
        Recent{isUnilateral ? ' (per side)' : ''}
      </p>
      {entries.map((entry, i) => {
        const dateLabel = format(parseISO(entry.workoutDate), 'MMM d')
        const summary = formatTrackingAwareSetSummary({
          reps: entry.reps,
          weightKg: entry.weightKg,
          rpe: entry.rpe,
          durationSeconds: entry.durationSeconds,
          distanceMeters: entry.distanceMeters,
        }, trackingMode)
        if (!summary) return null

        return (
          <p key={i} className="text-xs text-muted-foreground">
            {dateLabel} — {summary}
          </p>
        )
      })}
    </div>
  )
}
