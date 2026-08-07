import { Card, CardContent } from '@/components/ui/card'
import { formatWorkoutDuration } from '@/lib/workout'
import type { WorkoutCompletionSummary } from '@/lib/workout'

interface WorkoutCompletionSummaryCardProps {
  summary: WorkoutCompletionSummary
  startTime: string | null
  endTime: string | null
  completedDurationSeconds: number | null
  notes: string | null
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
  notes,
}: WorkoutCompletionSummaryCardProps) {
  const duration = formatWorkoutDuration(startTime, endTime, completedDurationSeconds)
  const { targetCounts, effort } = summary
  const trimmedNotes = notes?.trim() ?? ''

  const showTargetExecution = targetCounts.evaluated > 0
  const showEffort = effort.loggedRpeCount > 0 || effort.missingRpeCount > 0

  const effortParts = [
    effort.averageRpe !== null ? `Average RPE ${effort.averageRpe}` : null,
    effort.highEffortCount > 0 ? `${effort.highEffortCount} high` : null,
    effort.missingRpeCount > 0 ? `${effort.missingRpeCount} missing` : null,
  ].filter(Boolean)

  return (
    <Card variant="elevated" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink">Workout complete</h2>
        {duration && (
          <p className="text-xs text-ink-muted mt-0.5">Duration: {duration}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-sm text-ink">
        <span>
          {summary.completedExerciseCount} of {summary.exerciseCount} exercises
        </span>
        <span className="text-ink-muted">·</span>
        <span>{summary.workingSetCount} working sets</span>
        {summary.prSetCount > 0 && (
          <>
            <span className="text-ink-muted">·</span>
            <span>
              {summary.prSetCount} PR set{summary.prSetCount !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {showTargetExecution && (
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Target execution</p>
          <p className="text-sm text-ink">
            {targetCounts.belowTarget} below · {targetCounts.inRange} in range ·{' '}
            {targetCounts.topOfRange} top · {targetCounts.aboveTarget} above
          </p>
        </div>
      )}

      {showEffort && (
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Effort</p>
          <p className="text-sm text-ink">{effortParts.join(' · ')}</p>
        </div>
      )}

      {summary.highlights.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Highlights</p>
          <ul className="space-y-1">
            {summary.highlights.map((h, i) => (
              <li key={i} className="text-sm text-ink">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.attention.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Attention</p>
          <ul className="space-y-1">
            {summary.attention.map((a, i) => (
              <li key={i} className="text-sm text-ink">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {trimmedNotes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Session notes</p>
          <p className="text-sm text-ink whitespace-pre-wrap break-words">{trimmedNotes}</p>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
