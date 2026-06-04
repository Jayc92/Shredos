import { UtensilsCrossed } from 'lucide-react'
import type { NutritionTarget } from '@/types/database'

interface NutritionCardProps {
  target: NutritionTarget | null
}

function MacroBar({
  label,
  grams,
  calories,
  color,
}: {
  label: string
  grams: number
  calories: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium tabular-nums">{grams}g</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full">
        <div className={`h-full ${color} rounded-full`} style={{ width: '100%' }} />
      </div>
      <p className="text-xs text-muted-foreground">{calories} cal</p>
    </div>
  )
}

export function NutritionCard({ target }: NutritionCardProps) {
  if (!target) {
    return (
      <div className="shred-card space-y-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Nutrition targets</span>
        </div>
        <p className="text-sm text-muted-foreground">No nutrition targets set.</p>
        <a href="/nutrition" className="text-sm text-primary hover:underline">
          Set up targets →
        </a>
      </div>
    )
  }

  const proteinCal = target.protein_g * 4
  const carbsCal = target.carbs_g * 4
  const fatCal = target.fat_g * 9

  return (
    <div className="shred-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Daily targets</span>
        </div>
        <a href="/nutrition" className="text-xs text-primary hover:underline">
          Edit
        </a>
      </div>

      {/* Calorie target */}
      <div>
        <p className="metric-label">Calorie target</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="metric-value">{target.calories.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm mb-1">cal/day</span>
        </div>
        {target.deficit !== null && target.deficit !== 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {target.deficit > 0 ? `${target.deficit} cal deficit` : `${Math.abs(target.deficit)} cal surplus`}
            {target.maintenance_cal ? ` from ${target.maintenance_cal.toLocaleString()} maintenance` : ''}
          </p>
        )}
      </div>

      {/* Macro targets */}
      <div className="space-y-3 pt-1">
        <MacroBar
          label="Protein"
          grams={target.protein_g}
          calories={proteinCal}
          color="bg-blue-500"
        />
        <MacroBar
          label="Carbs"
          grams={target.carbs_g}
          calories={carbsCal}
          color="bg-yellow-500"
        />
        <MacroBar
          label="Fat"
          grams={target.fat_g}
          calories={fatCal}
          color="bg-orange-500"
        />
      </div>

      {/* Warnings */}
      {target.low_carb_warning && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-400">
            Carbs are low ({target.carbs_g}g). This may affect training energy. See{' '}
            <a href="/nutrition" className="underline">
              Nutrition
            </a>{' '}
            to adjust.
          </p>
        </div>
      )}

      {/* Food log placeholder */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Food logging arrives in Phase 1B.
        </p>
      </div>
    </div>
  )
}
