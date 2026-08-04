// ============================================================
// ShredOS — Weight Trend Section (Phase 2Y)
// Server-rendered trend summary + 28-day chart for /weigh-in. Pure
// display: receives the already-built WeightTrendSummary (derived
// from the page's existing weigh-in fetch — no new queries, no
// client-side database access) and renders literal, judgment-free
// trend language. Direction is never colored good/bad; "up" and
// "down" are directions, not verdicts.
// ============================================================

import { format, parseISO } from 'date-fns'
import ExerciseTrendChart from '@/components/progress/ExerciseTrendChart'
import {
  WEIGHT_CHART_MIN_VISIBLE_RANGE_LBS,
  MIN_DATES_FOR_AVERAGE,
} from '@/lib/weight-trends'
import type { WeightTrendSummary } from '@/lib/weight-trends'

interface WeightTrendSectionProps {
  summary: WeightTrendSummary
}

export function WeightTrendSection({ summary }: WeightTrendSectionProps) {
  const {
    latest,
    distinctDateCount,
    currentAverageLbs,
    currentAverageCount,
    averageChangeLabel,
    chartPoints,
    goalWeightLbs,
    goalDifferenceLabel,
  } = summary

  return (
    <>
      {/* Trend summary */}
      <div className="shred-card space-y-2">
        <h3 className="text-sm font-medium text-foreground">Weight trend</h3>

        {!latest ? (
          <p className="text-sm text-muted-foreground">
            Log your first weigh-in to begin tracking body weight.
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {latest.weightLbs.toFixed(1)} lbs
              </span>
              <span className="text-sm text-muted-foreground">
                Latest · {format(parseISO(latest.date), 'MMM d')}
              </span>
            </div>

            {currentAverageLbs !== null ? (
              <>
                <p className="text-sm text-foreground">
                  Current 7-day average: {currentAverageLbs.toFixed(1)} lbs
                  <span className="text-xs text-muted-foreground">
                    {' '}· Based on {currentAverageCount} weigh-in
                    {currentAverageCount !== 1 ? 's' : ''}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {averageChangeLabel ?? 'Not enough prior data for a seven-day comparison.'}
                </p>
              </>
            ) : distinctDateCount < MIN_DATES_FOR_AVERAGE ? (
              <p className="text-sm text-muted-foreground">
                Log at least two weigh-ins to see a weight trend.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough recent weigh-ins for a seven-day average.
              </p>
            )}

            {goalWeightLbs !== null && goalDifferenceLabel !== null && (
              <p className="text-sm text-muted-foreground">
                Goal: {goalWeightLbs.toFixed(1)} lbs · {goalDifferenceLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 28-day chart — only rendered with two or more distinct dates
          in the window; a one-point "line" would be misleading. */}
      {latest &&
        (chartPoints.length >= 2 ? (
          <ExerciseTrendChart
            title="Weight — last 28 days"
            points={chartPoints}
            summary={averageChangeLabel ?? undefined}
            minVisibleRange={WEIGHT_CHART_MIN_VISIBLE_RANGE_LBS}
          />
        ) : (
          <div className="shred-card space-y-1.5">
            <h3 className="text-sm font-medium text-foreground">Weight — last 28 days</h3>
            <p className="text-sm text-muted-foreground">
              Log at least two weigh-ins to see a weight trend.
            </p>
          </div>
        ))}
    </>
  )
}
