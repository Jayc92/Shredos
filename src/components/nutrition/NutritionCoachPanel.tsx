// ============================================================
// ShredOS — NutritionCoachPanel (Phase 1F)
// Compact 7-day coaching summary shown on the /food page.
// Hidden when hasEnoughData = false (< 4 logged days).
// Calorie suggestion only shown for fat_loss / recomposition
// goals with high logging confidence and sufficient weight data.
// ============================================================

import type { NutritionCoachSummary } from '@/lib/nutrition-coach'

interface NutritionCoachPanelProps {
  summary: NutritionCoachSummary
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high:         'High confidence',
  moderate:     'Moderate confidence',
  low:          'Low — log more days',
  insufficient: 'Insufficient data',
}

const CONFIDENCE_CLS: Record<string, string> = {
  high:         'bg-green-500/10 text-green-400',
  moderate:     'bg-blue-500/10 text-blue-400',
  low:          'bg-amber-500/10 text-amber-400',
  insufficient: 'bg-secondary text-muted-foreground',
}

export function NutritionCoachPanel({ summary }: NutritionCoachPanelProps) {
  // Hidden until enough data to be useful
  if (!summary.hasEnoughData) return null

  return (
    <div className="shred-card space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">This week</h2>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            CONFIDENCE_CLS[summary.loggingConfidence]
          }`}
        >
          {CONFIDENCE_LABEL[summary.loggingConfidence]}
        </span>
      </div>

      {/* 7-day summary — up to 3 stat tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{summary.loggedDaysLast7}/7</p>
          <p className="text-xs text-muted-foreground mt-0.5">days logged</p>
        </div>
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">
            {summary.avgCaloriesLast7 !== null
              ? summary.avgCaloriesLast7.toLocaleString()
              : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">avg cal/day</p>
        </div>
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">
            {summary.avgProteinLast7 !== null ? `${summary.avgProteinLast7}g` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">avg protein</p>
        </div>
      </div>

      {/* Weight trend — only when reliable data exists */}
      {summary.weightTrend !== 'insufficient-data' &&
        summary.weeklyWeightChangeLbs !== null && (
          <div className="flex items-center justify-between border-t border-border pt-2.5">
            <span className="text-xs text-muted-foreground">
              Weight trend (3‑week window)
            </span>
            <span
              className={`text-xs font-medium ${
                summary.weightTrend === 'losing'
                  ? 'text-green-400'
                  : summary.weightTrend === 'gaining'
                  ? 'text-red-400'
                  : 'text-muted-foreground'
              }`}
            >
              {summary.weightTrend === 'losing'
                ? `Down ${Math.abs(summary.weeklyWeightChangeLbs)} lb/wk`
                : summary.weightTrend === 'gaining'
                ? `Up ${summary.weeklyWeightChangeLbs} lb/wk`
                : 'Holding steady'}
            </span>
          </div>
        )}

      {/* Calorie suggestion — conservative, multi-gated */}
      {summary.calorieSuggestion && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2.5">
          <p className="text-xs text-blue-400 leading-relaxed">
            {summary.calorieSuggestion}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Targets are never changed automatically. Adjust in{' '}
            <a href="/nutrition" className="text-primary hover:underline">
              Nutrition settings
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}
