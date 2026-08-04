// ============================================================
// ShredOS — Nutrition Trend Section (Phase 2Z)
// Display-only trend summary + 28-day charts for /nutrition. Receives
// the already-built NutritionTrendSummary (derived from the page's
// bounded food-log fetch) and renders neutral, literal language:
// coverage and averages are facts, up/down are directions, and no
// color implies calorie or protein quality. Works in both server and
// client trees (no hooks, no state).
// ============================================================

import ExerciseTrendChart from '@/components/progress/ExerciseTrendChart'
import {
  CALORIE_CHART_MIN_VISIBLE_RANGE,
  PROTEIN_CHART_MIN_VISIBLE_RANGE_G,
  MIN_LOGGED_DAYS_FOR_AVERAGE,
} from '@/lib/nutrition-trends'
import type { NutritionTrendSummary } from '@/lib/nutrition-trends'

interface NutritionTrendSectionProps {
  summary: NutritionTrendSummary
}

export function NutritionTrendSection({ summary }: NutritionTrendSectionProps) {
  const {
    latestLoggedDate,
    currentWindowLabel,
    totalLoggedDays,
    currentLoggedDays,
    currentAverageCalories,
    currentCalorieDays,
    currentAverageProteinGrams,
    currentProteinDays,
    calorieComparisonLabel,
    proteinComparisonLabel,
    loggingComparisonLabel,
    proteinTargetMetDays,
    proteinTargetEligibleDays,
    latestDayTotal,
    calorieChartPoints,
    proteinChartPoints,
  } = summary

  const hasComparison =
    calorieComparisonLabel !== null ||
    proteinComparisonLabel !== null ||
    loggingComparisonLabel !== null

  return (
    <>
      {/* Seven-day summary */}
      <div className="shred-card space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Nutrition trend</h3>
          {currentWindowLabel && (
            <span className="text-xs text-muted-foreground">{currentWindowLabel}</span>
          )}
        </div>

        {!latestLoggedDate ? (
          <p className="text-sm text-muted-foreground">
            Log food to begin tracking nutrition consistency.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground">
              {currentLoggedDays} of 7 days logged
              <span className="text-xs text-muted-foreground">
                {' '}· {Math.round((currentLoggedDays / 7) * 100)}% logging coverage
              </span>
            </p>

            {totalLoggedDays < MIN_LOGGED_DAYS_FOR_AVERAGE ? (
              <>
                {latestDayTotal && (
                  <p className="text-sm text-muted-foreground">
                    Latest logged day:
                    {latestDayTotal.calories !== null &&
                      ` ${Math.round(latestDayTotal.calories).toLocaleString()} cal`}
                    {latestDayTotal.proteinGrams !== null &&
                      ` · ${Math.round(latestDayTotal.proteinGrams)}g protein`}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Log nutrition on at least two days to calculate a seven-day average.
                </p>
              </>
            ) : (
              <>
                {currentAverageCalories !== null && (
                  <p className="text-sm text-foreground">
                    {currentAverageCalories.toLocaleString()} average calories
                    <span className="text-xs text-muted-foreground">
                      {' '}· Based on {currentCalorieDays} logged day
                      {currentCalorieDays !== 1 ? 's' : ''}
                    </span>
                  </p>
                )}
                {currentAverageProteinGrams !== null && (
                  <p className="text-sm text-foreground">
                    {currentAverageProteinGrams}g average protein
                    <span className="text-xs text-muted-foreground">
                      {' '}· Based on {currentProteinDays} logged day
                      {currentProteinDays !== 1 ? 's' : ''}
                    </span>
                  </p>
                )}
                {currentAverageCalories === null && currentAverageProteinGrams === null && (
                  <p className="text-sm text-muted-foreground">
                    Log nutrition on at least two days in the current week to calculate a
                    seven-day average.
                  </p>
                )}

                {proteinTargetMetDays !== null && proteinTargetEligibleDays !== null && (
                  <p className="text-sm text-muted-foreground">
                    Protein target met on {proteinTargetMetDays} of {proteinTargetEligibleDays}{' '}
                    logged day{proteinTargetEligibleDays !== 1 ? 's' : ''}
                  </p>
                )}

                {hasComparison ? (
                  <div className="space-y-0.5">
                    {calorieComparisonLabel && (
                      <p className="text-xs text-muted-foreground">{calorieComparisonLabel}</p>
                    )}
                    {proteinComparisonLabel && (
                      <p className="text-xs text-muted-foreground">{proteinComparisonLabel}</p>
                    )}
                    {loggingComparisonLabel && (
                      <p className="text-xs text-muted-foreground">{loggingComparisonLabel}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Not enough prior data for a seven-day comparison.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 28-day charts — only with two or more valid daily points; a
          one-point line would be misleading. Missing days are simply
          absent (no interpolation, no fake zeros). */}
      {latestLoggedDate && (
        <>
          {calorieChartPoints.length >= 2 ? (
            <ExerciseTrendChart
              title="Calories — last 28 days"
              points={calorieChartPoints}
              summary={calorieComparisonLabel ?? undefined}
              minVisibleRange={CALORIE_CHART_MIN_VISIBLE_RANGE}
            />
          ) : (
            <div className="shred-card space-y-1.5">
              <h3 className="text-sm font-medium text-foreground">Calories — last 28 days</h3>
              <p className="text-sm text-muted-foreground">
                Log nutrition on at least two days to see a trend.
              </p>
            </div>
          )}

          {proteinChartPoints.length >= 2 ? (
            <ExerciseTrendChart
              title="Protein — last 28 days"
              points={proteinChartPoints}
              summary={proteinComparisonLabel ?? undefined}
              minVisibleRange={PROTEIN_CHART_MIN_VISIBLE_RANGE_G}
              compact
            />
          ) : (
            <div className="shred-card space-y-1.5">
              <h3 className="text-sm font-medium text-foreground">Protein — last 28 days</h3>
              <p className="text-sm text-muted-foreground">
                Log nutrition on at least two days to see a trend.
              </p>
            </div>
          )}
        </>
      )}
    </>
  )
}
