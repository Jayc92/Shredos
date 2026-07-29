import { formatWorkoutDuration } from '@/lib/workout'
import type { WorkoutCompletionSummary } from '@/lib/workout'

interface WorkoutCompletionSummaryCardProps {
  summary: WorkoutCompletionSummary
  startTime: string | null
  endTime: string | null
  completedDurationSeconds: number | null
}

/**
 * Compact, presentational summary shown at the top of a completed
 * workout (Phase 2H). Purely renders an already-computed
 * WorkoutCompletionSummary — it does not fetch, filter, or evaluate
 * anything itself, matching the architecture already established for
 * ExerciseHistoryRows/ProgressBadge. Sections that would be empty or
 * zero-only are omitted entirely rather than shown with misleading
 * placeholder values, so this renders identically whether shown right
 * after completion or when reopening the workout later.
 */
export function WorkoutCompletionSummaryCard({
  summary,
  startTime,
  endTime,
  completedDurationSeconds,
}: WorkoutCompletionSummaryCardProps) {
  const duration = formatWorkoutDuration(startTime, endTime, completedDurationSeconds)
  const { targetCounts, effort } = summary

  const showTargetExecution = targetCounts.evaluated > 0
  const showEffort = effort.loggedRpeCount > 0 || effort.missingRpeCount > 0

  const effortParts = [
    effort.averageRpe !== null ? `Average RPE ${effort.averageRpe}` : null,
    effort.highEffortCount > 0 ? `${effort.highEffortCount} high` : null,
    effort.missingRpeCount > 0 ? `${effort.missingRpeCount} missing` : null,
  ].filter(Boolean)

  return (
    <div className="shred-card space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Workout complete</h2>
        {duration && (
          <p className="text-xs text-muted-foreground mt-0.5">Duration: {duration}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-sm text-foreground">
        <span>
          {summary.completedExerciseCount} of {summary.exerciseCount} exercises
        </span>
        <span className="text-muted-foreground">·</span>
        <span>{summary.workingSetCount} working sets</span>
        {summary.prSetCount > 0 && (
          <>
            <span className="text-muted-foreground">·</span>
            <span>
              {summary.prSetCount} PR set{summary.prSetCount !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {showTargetExecution && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Target execution</p>
          <p className="text-sm text-foreground">
            {targetCounts.belowTarget} below · {targetCounts.inRange} in range ·{' '}
            {targetCounts.topOfRange} top · {targetCounts.aboveTarget} above
          </p>
        </div>
      )}

      {showEffort && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Effort</p>
          <p className="text-sm text-foreground">{effortParts.join(' · ')}</p>
        </div>
      )}

      {summary.highlights.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Highlights</p>
          <ul className="space-y-1">
            {summary.highlights.map((h, i) => (
              <li key={i} className="text-sm text-foreground">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.attention.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Attention</p>
          <ul className="space-y-1">
            {summary.attention.map((a, i) => (
              <li key={i} className="text-sm text-foreground">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
