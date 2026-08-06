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
import { Card, CardContent } from '@/components/ui/card'

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
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h3 className="text-sm font-medium text-ink">Weight trend</h3>

        {!latest ? (
          <p className="text-sm text-ink-muted">
            Log your first weigh-in to begin tracking body weight.
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {latest.weightLbs.toFixed(1)} lbs
              </span>
              <span className="text-sm text-ink-muted">
                Latest · {format(parseISO(latest.date), 'MMM d')}
              </span>
            </div>

            {currentAverageLbs !== null ? (
              <>
                <p className="text-sm text-ink">
                  Current 7-day average: {currentAverageLbs.toFixed(1)} lbs
                  <span className="text-xs text-ink-muted">
                    {' '}· Based on {currentAverageCount} weigh-in
                    {currentAverageCount !== 1 ? 's' : ''}
                  </span>
                </p>
                <p className="text-sm text-ink-muted">
                  {averageChangeLabel ?? 'Not enough prior data for a seven-day comparison.'}
                </p>
              </>
            ) : distinctDateCount < MIN_DATES_FOR_AVERAGE ? (
              <p className="text-sm text-ink-muted">
                Log at least two weigh-ins to see a weight trend.
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                Not enough recent weigh-ins for a seven-day average.
              </p>
            )}

            {goalWeightLbs !== null && goalDifferenceLabel !== null && (
              <p className="text-sm text-ink-muted">
                Goal: {goalWeightLbs.toFixed(1)} lbs · {goalDifferenceLabel}
              </p>
            )}
          </div>
        )}
      </CardContent>
      </Card>

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
          <Card variant="metric" className="gap-0 py-4">
            <CardContent className="space-y-1.5">
            <h3 className="text-sm font-medium text-ink">Weight — last 28 days</h3>
            <p className="text-sm text-ink-muted">
              Log at least two weigh-ins to see a weight trend.
            </p>
          </CardContent>
          </Card>
        ))}
    </>
  )
}
