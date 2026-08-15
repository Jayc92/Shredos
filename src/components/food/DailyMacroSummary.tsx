import { progressColor, remainingColor } from '@/lib/food'
import type { NutritionProgress } from '@/types/app'
import type { NutritionTarget } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface DailyMacroSummaryProps {
  progress: NutritionProgress | null
  target: NutritionTarget | null
  compact?: boolean // true for dashboard card
}

interface BarRowProps {
  label: string
  consumed: number
  target: number
  pct: number
  remaining: number
  unit?: string
  isCalories?: boolean
}

function BarRow({ label, consumed, target, pct, remaining, unit = 'g', isCalories = false }: BarRowProps) {
  const fillColor = progressColor(pct, isCalories)
  const remColor  = remainingColor(remaining)
  const cappedPct = Math.min(100, pct)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted font-medium">{label}</span>
        <span className="tabular-nums text-ink">
          {isCalories ? consumed.toLocaleString() : consumed.toFixed(1)}{isCalories ? '' : unit}
          <span className="text-ink-muted"> / {isCalories ? target.toLocaleString() : target}{isCalories ? ' cal' : unit}</span>
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-300`}
          style={{ width: `${cappedPct}%` }}
        />
      </div>
      <div className={`text-xs ${remColor} text-right`}>
        {remaining >= 0
          ? `${isCalories ? Math.abs(remaining).toLocaleString() : Math.abs(remaining).toFixed(1)}${isCalories ? ' cal' : unit} remaining`
          : `${isCalories ? Math.abs(remaining).toLocaleString() : Math.abs(remaining).toFixed(1)}${isCalories ? ' cal' : unit} over target`}
      </div>
    </div>
  )
}

export function DailyMacroSummary({ progress, target, compact = false }: DailyMacroSummaryProps) {
  if (!target) {
    return (
      <Card variant="status" className="gap-0 py-4">
        <CardContent>
        <p className="text-sm text-ink-muted">
          No nutrition targets set.{' '}
          <a href="/nutrition" className="text-brand hover:underline">Set targets →</a>
        </p>
      </CardContent>
      </Card>
    )
  }

  if (!progress) {
    // No food logged yet
    return (
      <Card variant="metric" className="gap-0 py-4">
        {/* Food-log UX fix: this was a literal "space-y-3 ${...}"
            string (the ${...} never evaluated). Static, statically
            discoverable class variants instead. */}
        <CardContent className={compact ? 'space-y-3 py-3' : 'space-y-3'}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Today</span>
          <span className="text-xs text-ink-muted">Target: {target.calories.toLocaleString()} cal</span>
        </div>
        <p className="text-sm text-ink-muted">No food logged yet today.</p>
        <a href="/food" className="text-xs text-brand hover:underline">Log food →</a>
      </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="gap-0 py-4">
      {/* Food-log UX fix: this was the literal string
          "space-y-${compact ? '2' : '3'}" — no valid spacing class was
          ever emitted, so metric groups had no vertical separation and
          each metric's remaining/over-target line sat flush against
          the NEXT metric's label. Static variants: compact stays
          compact (Today widget), the full Food Log gets clearer
          separation. */}
      <CardContent className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Warnings */}
      {progress.warnings.length > 0 && (
        <div className="space-y-1.5">
          {progress.warnings.map((w, i) => (
            <div key={i} className="bg-caution-subtle border border-caution/20 rounded-lg px-3 py-2">
              <p className="text-xs text-caution">{w}</p>
            </div>
          ))}
        </div>
      )}

      <BarRow
        label="Calories"
        consumed={progress.calories.consumed}
        target={progress.calories.target}
        pct={progress.calories.pct}
        remaining={progress.calories.remaining}
        isCalories
      />
      <BarRow
        label="Protein"
        consumed={progress.protein_g.consumed}
        target={progress.protein_g.target}
        pct={progress.protein_g.pct}
        remaining={progress.protein_g.remaining}
      />
      {!compact && (
        <>
          <BarRow
            label="Carbs"
            consumed={progress.carbs_g.consumed}
            target={progress.carbs_g.target}
            pct={progress.carbs_g.pct}
            remaining={progress.carbs_g.remaining}
          />
          <BarRow
            label="Fat"
            consumed={progress.fat_g.consumed}
            target={progress.fat_g.target}
            pct={progress.fat_g.pct}
            remaining={progress.fat_g.remaining}
          />
        </>
      )}

      <div className="pt-1 border-t border-edge-subtle">
        <a href="/food" className="text-xs text-brand hover:underline">
          Log food →
        </a>
      </div>
    </CardContent>
    </Card>
  )
}
