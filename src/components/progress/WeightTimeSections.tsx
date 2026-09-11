import { format, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatDurationSeconds,
  formatAddedWeightLb,
  formatTrackingAwareSetSummary,
  suggestNextTarget,
  compareWeightTimeSets,
  describeWeightTimeComparison,
} from '@/lib/workout'
import type { ExerciseHistoryEntry } from '@/lib/workout'
import type { WeightTimeExerciseDetail, WeightTimePerformance } from '@/lib/weight-time-records'
import type { WorkoutSet } from '@/types/database'

// ============================================================
// ShredOS — weight_time exercise progress sections (W10)
//
// The /progress/exercises/[id] body for a weighted hold. Exactly the
// three approved record concepts (plan §4.2, O6), each distinct:
//   1. Longest hold      — duration, with its associated added weight
//   2. Heaviest hold     — added weight, with its associated duration
//   3. Weight-time PR frontier — the compact list of CURRENT
//      non-dominated (weight, duration) pairs sorted by added weight,
//      with NO scalar ranking between incomparable pairs (never #1/#2/#3,
//      never a single "best set").
// plus coaching (the two approved neutral strings), recent history and
// the historical "Weight-time PR" events. A stored 0 renders as
// "0 lb added" (O5). RPE appears only as metadata in history lines.
//
// No trend chart: the two dimensions have no scalar to plot (D4), and a
// chart design for a 2-D frontier was not part of the approved scope.
//
// Pure server component — no hooks, no state — so
// scripts/verify-weight-time-w10-ui.ts renders it to static markup over
// fixtures and proves the copy, the sort order and the zero rendering.
// ============================================================

const PR_HISTORY_INITIAL_CAP = 10

/** Synthetic WorkoutSet adapter — the same convention the detail page uses for the other modes. */
function toSyntheticSet(performance: WeightTimePerformance): WorkoutSet {
  return {
    id: performance.setId,
    workout_exercise_id: '',
    set_number: performance.setNumber,
    weight_kg: performance.weightKg,
    reps: null,
    rpe: performance.rpe,
    completed: true,
    is_warmup: false,
    notes: null,
    duration_seconds: performance.durationSeconds,
    distance_meters: null,
    created_at: performance.workoutDate,
  }
}

/** "1:30 · 20 lb added" (+ " per side" for a unilateral exercise). */
export function formatHold(performance: WeightTimePerformance, suffix: string): string {
  return `${formatDurationSeconds(performance.durationSeconds) ?? '0:00'} · ${formatAddedWeightLb(performance.weightKg)}${suffix}`
}

export interface WeightTimeSectionsProps {
  /** null when the exercise has no completed history yet. */
  detail: WeightTimeExerciseDetail | null
  recentEntries: ExerciseHistoryEntry[]
  isUnilateral: boolean
}

export function WeightTimeSections({ detail, recentEntries, isUnilateral }: WeightTimeSectionsProps) {
  const suffix = isUnilateral ? ' per side' : ''
  const summary = detail?.summary ?? null
  const hasAnyRecord = summary !== null && summary.qualifyingCount > 0

  // Coaching from the latest completed qualifying SESSION's representativeHold
  // (this read-only page has no session context): the approved neutral
  // guidance, and the two-dimensional comparison against the previous
  // session's representativeHold — an incomparable pair is reported as the
  // actual dimensional change ("Heavier, shorter"), never as a direction.
  //
  // W12-R1-3(B): both anchors are session representatives, selected from all
  // of their session's qualifying sets across every block. They used to be
  // the last chronological SET of each session, which contradicted the
  // representativeHold semantics this same comparison claims to use.
  const latest = detail?.latestSessionRepresentative ?? null
  const previous = detail?.previousSessionRepresentative ?? null
  const latestSet = latest ? toSyntheticSet(latest) : null
  const nextTarget = suggestNextTarget(latestSet, isUnilateral, 'weight_time', null)
  const comparison = latest && previous
    ? compareWeightTimeSets(latestSet, toSyntheticSet(previous))
    : null

  const prEvents = summary?.prEvents ?? []
  const visiblePrHistory = prEvents.slice(0, PR_HISTORY_INITIAL_CAP)
  const remainingPrHistory = prEvents.slice(PR_HISTORY_INITIAL_CAP)

  return (
    <>
      {/* A. Current records — the three approved concepts, kept distinct */}
      <Card variant="elevated" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Current records</h2>
        {!hasAnyRecord || !summary ? (
          <p className="text-sm text-ink-muted">No records yet.</p>
        ) : (
          <div className="space-y-2">
            {summary.longestHold && (
              <p className="text-sm text-ink" data-record="longest-hold">
                Longest hold: {formatDurationSeconds(summary.longestHold.durationSeconds)} ({formatAddedWeightLb(summary.longestHold.weightKg)}{suffix})
              </p>
            )}
            {summary.heaviestHold && (
              <p className="text-sm text-ink" data-record="heaviest-hold">
                Heaviest hold: {formatAddedWeightLb(summary.heaviestHold.weightKg)}{suffix} ({formatDurationSeconds(summary.heaviestHold.durationSeconds)})
              </p>
            )}
            <div>
              <p className="text-sm text-ink">Weight-time PR frontier</p>
              <p className="text-xs text-ink-muted">
                Current non-dominated holds, lightest to heaviest. A heavier-but-shorter hold and a lighter-but-longer hold are both records.
              </p>
              <ul className="mt-1 space-y-0.5" data-record="frontier">
                {summary.frontier.map((point) => (
                  <li key={point.setId} className="text-sm tabular-nums text-ink">
                    {formatAddedWeightLb(point.weightKg)}{suffix} · {formatDurationSeconds(point.durationSeconds)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* B. Current coaching — neutral, one dimension at a time */}
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Current coaching</h2>
        {latest && (
          <p className="text-sm text-ink-muted">Last: {formatHold(latest, suffix)}</p>
        )}
        <p className="text-sm text-ink-muted">{nextTarget.message}</p>
        {comparison && comparison !== 'new' && (
          <p className="text-xs text-ink-muted" data-comparison={comparison}>
            Vs. previous session: {describeWeightTimeComparison(comparison)}
          </p>
        )}
        </CardContent>
      </Card>

      {/* C. Recent history — one representative hold per session */}
      <Card variant="subtle" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Recent history</h2>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-ink-muted">No completed sets yet.</p>
        ) : (
          <ul className="space-y-1">
            {recentEntries.map((entry, index) => {
              const line = formatTrackingAwareSetSummary(entry, 'weight_time')
              if (!line) return null
              return (
                <li key={index} className="text-xs text-ink-muted">
                  {format(parseISO(entry.workoutDate), 'MMM d')} — {line}{suffix}
                </li>
              )
            })}
          </ul>
        )}
        </CardContent>
      </Card>

      {/* D. Weight-time PR history — every frontier-improving hold, in chronology */}
      <Card variant="default" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">PR history</h2>
        {prEvents.length === 0 ? (
          <p className="text-sm text-ink-muted">No PRs yet.</p>
        ) : (
          <>
            <ul className="space-y-1.5" data-record="pr-history">
              {visiblePrHistory.map((event) => (
                <li key={event.setId} className="text-xs text-ink">
                  {format(parseISO(event.workoutDate), 'MMM d')} — Weight-time PR — {formatHold(event, suffix)}
                </li>
              ))}
            </ul>
            {remainingPrHistory.length > 0 && (
              <details>
                <summary className="text-xs text-brand hover:underline cursor-pointer">
                  Show all ({remainingPrHistory.length} more)
                </summary>
                <ul className="space-y-1.5 mt-1.5">
                  {remainingPrHistory.map((event) => (
                    <li key={event.setId} className="text-xs text-ink">
                      {format(parseISO(event.workoutDate), 'MMM d')} — Weight-time PR — {formatHold(event, suffix)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
        </CardContent>
      </Card>
    </>
  )
}
