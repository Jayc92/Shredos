// ============================================================
// ForgeFitOS — Energy Balance card (Phase 5B.3)
// Server component: renders the finished TodayEnergyBalanceViewModel
// verbatim — no energy arithmetic happens here (the lib owns every
// number). Daily intake and multi-week trajectory are visually
// distinct rows so today's calories never masquerade as the trend.
// No session-calorie totals, no "calories burned", no eat-back —
// this is a trajectory card, not an exercise-calorie calculator.
// ============================================================

import { Gauge } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TodayEnergyBalanceViewModel } from '@/lib/today-energy'

interface EnergyBalanceCardProps {
  model: TodayEnergyBalanceViewModel
}

const ACTIVITY_LABELS: Record<TodayEnergyBalanceViewModel['activityContext'], string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  unknown: 'Not enough activity history',
}

const CONFIDENCE_LABELS: Record<TodayEnergyBalanceViewModel['confidenceLevel'], string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
}

export function EnergyBalanceCard({ model }: EnergyBalanceCardProps) {
  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-ink-muted" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-muted">Energy Balance</span>
        </div>

        {/* Daily intake — its own row, never conflated with the trend. */}
        {model.calorieState === 'no_target' ? (
          <p className="text-sm text-ink-muted">
            Set your nutrition targets to track energy balance.
          </p>
        ) : model.calorieState === 'no_food' ? (
          <div className="space-y-0.5">
            <p className="text-xs text-ink-muted">Calories</p>
            <p className="text-sm text-ink-muted">
              Start logging food to see today&rsquo;s intake.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-xs text-ink-muted">Calories</p>
            <p className="text-xl font-bold tabular-nums text-ink">
              {model.caloriesConsumed!.toLocaleString()}
              <span className="text-sm font-normal text-ink-muted">
                {' '}/ {model.calorieTarget!.toLocaleString()}
              </span>
            </p>
          </div>
        )}

        {/* Compact stacked rows — no dense multi-column layout. */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-ink-muted">Activity</span>
            <span className="text-xs font-medium text-ink text-right">
              {ACTIVITY_LABELS[model.activityContext]}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-ink-muted">Recent trend</span>
            <span className="text-xs font-medium text-ink text-right">
              {model.trajectoryState === 'not_enough_data'
                ? 'We’re still learning your trend'
                : model.trajectoryLabel}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-ink-muted">Confidence</span>
            <span className="text-xs font-medium text-ink text-right">
              {CONFIDENCE_LABELS[model.confidenceLevel]}
            </span>
          </div>
        </div>

        {/* Missing-evidence guidance from structured reason codes. */}
        {model.confidenceMessage && (
          <p className="text-xs text-ink-muted">{model.confidenceMessage}</p>
        )}

        {/* Inferred maintenance: a RANGE at high confidence only; a
            settling note at moderate; nothing below that. */}
        {model.maintenanceRange && (
          <p className="text-xs text-ink">
            Estimated maintenance:{' '}
            <span className="font-medium tabular-nums">
              {model.maintenanceRange[0].toLocaleString()}&ndash;{model.maintenanceRange[1].toLocaleString()} kcal/day
            </span>
          </p>
        )}
        {model.maintenanceNote && (
          <p className="text-xs text-ink-muted">{model.maintenanceNote}</p>
        )}

        <p className="text-xs text-ink-muted">
          Based on your recent intake, weekly weigh-ins, and activity pattern.
        </p>
      </CardContent>
    </Card>
  )
}
