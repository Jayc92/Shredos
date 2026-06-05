import { UtensilsCrossed } from 'lucide-react'
import { computeDailyTotals, computeNutritionProgress, progressColor, remainingColor } from '@/lib/food'
import { todayISO } from '@/lib/dates'
import type { NutritionTarget, FoodLog } from '@/types/database'

interface NutritionCardProps {
  target: NutritionTarget | null
  todayLogs: FoodLog[]
}

interface BarProps {
  label: string
  consumed: number
  target: number
  pct: number
  remaining: number
  unit?: string
  isCalories?: boolean
}

function Bar({ label, consumed, target, pct, remaining, unit = 'g', isCalories = false }: BarProps) {
  const fill = progressColor(pct, isCalories)
  const remClr = remainingColor(remaining)
  const cap = Math.min(100, pct)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {isCalories ? consumed.toLocaleString() : consumed.toFixed(1)}{isCalories ? ' cal' : unit}
          <span className="text-muted-foreground"> / {isCalories ? target.toLocaleString() : target}{isCalories ? '' : unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${fill} rounded-full transition-all duration-300`} style={{ width: `${cap}%` }} />
      </div>
      <p className={`text-xs text-right ${remClr}`}>
        {remaining >= 0
          ? `${isCalories ? Math.abs(remaining).toLocaleString() : Math.abs(remaining).toFixed(1)}${isCalories ? ' cal' : unit} left`
          : `${isCalories ? Math.abs(remaining).toLocaleString() : Math.abs(remaining).toFixed(1)}${isCalories ? ' cal' : unit} over`}
      </p>
    </div>
  )
}

export function NutritionCard({ target, todayLogs }: NutritionCardProps) {
  if (!target) {
    return (
      <div className="shred-card space-y-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Nutrition targets</span>
        </div>
        <p className="text-sm text-muted-foreground">No nutrition targets set.</p>
        <a href="/nutrition" className="text-sm text-primary hover:underline">Set up targets →</a>
      </div>
    )
  }

  const today = todayISO()
  const totals = computeDailyTotals(todayLogs, today)
  const nowHour = new Date().getHours()
  const progress = computeNutritionProgress(totals, target, nowHour)

  return (
    <div className="shred-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Today&apos;s nutrition</span>
        </div>
        <a href="/food" className="text-xs text-primary hover:underline">Log food</a>
      </div>

      {/* Warnings */}
      {progress.warnings.length > 0 && (
        <div className="space-y-1">
          {progress.warnings.map((w, i) => (
            <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1.5">
              <p className="text-xs text-amber-300">⚠️ {w}</p>
            </div>
          ))}
        </div>
      )}

      {totals.entry_count === 0 ? (
        <div className="py-2 space-y-2">
          <p className="text-sm text-muted-foreground">No food logged yet today.</p>
          <div className="space-y-1.5">
            <Bar label="Calories" consumed={0} target={target.calories} pct={0} remaining={target.calories} isCalories />
            <Bar label="Protein"  consumed={0} target={target.protein_g} pct={0} remaining={target.protein_g} />
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <Bar label="Calories" consumed={progress.calories.consumed}  target={progress.calories.target}  pct={progress.calories.pct}  remaining={progress.calories.remaining}  isCalories />
          <Bar label="Protein"  consumed={progress.protein_g.consumed} target={progress.protein_g.target} pct={progress.protein_g.pct} remaining={progress.protein_g.remaining} />
          <Bar label="Carbs"    consumed={progress.carbs_g.consumed}   target={progress.carbs_g.target}   pct={progress.carbs_g.pct}   remaining={progress.carbs_g.remaining} />
          <Bar label="Fat"      consumed={progress.fat_g.consumed}     target={progress.fat_g.target}     pct={progress.fat_g.pct}     remaining={progress.fat_g.remaining} />
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <a href="/food" className="text-xs text-primary hover:underline">View full food log →</a>
      </div>
    </div>
  )
}
