import { progressColor, remainingColor } from '@/lib/food'
import type { NutritionProgress } from '@/types/app'
import type { NutritionTarget } from '@/types/database'

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
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="tabular-nums text-foreground">
          {isCalories ? consumed.toLocaleString() : consumed.toFixed(1)}{isCalories ? '' : unit}
          <span className="text-muted-foreground"> / {isCalories ? target.toLocaleString() : target}{isCalories ? ' cal' : unit}</span>
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
      <div className="shred-card">
        <p className="text-sm text-muted-foreground">
          No nutrition targets set.{' '}
          <a href="/nutrition" className="text-primary hover:underline">Set targets →</a>
        </p>
      </div>
    )
  }

  if (!progress) {
    // No food logged yet
    return (
      <div className={`shred-card space-y-3 ${compact ? 'py-3' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Today</span>
          <span className="text-xs text-muted-foreground">Target: {target.calories.toLocaleString()} cal</span>
        </div>
        <p className="text-sm text-muted-foreground">No food logged yet today.</p>
        <a href="/food" className="text-xs text-primary hover:underline">Log food →</a>
      </div>
    )
  }

  return (
    <div className={`shred-card space-y-${compact ? '2' : '3'}`}>
      {/* Warnings */}
      {progress.warnings.length > 0 && (
        <div className="space-y-1.5">
          {progress.warnings.map((w, i) => (
            <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-300">{w}</p>
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

      <div className="pt-1 border-t border-border">
        <a href="/food" className="text-xs text-primary hover:underline">
          Log food →
        </a>
      </div>
    </div>
  )
}
