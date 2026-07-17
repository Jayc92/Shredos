// ============================================================
// ShredOS — NutritionCard
// Phase 1B: real-time today vs target progress bars
// Phase 1F: optional coaching context (weekly summary + nudge)
// ============================================================

import { UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { computeDailyTotals, computeNutritionProgress, progressColor, remainingColor } from '@/lib/food'
import { todayISO } from '@/lib/dates'
import type { NutritionTarget, FoodLog } from '@/types/database'
import type { NutritionCoachSummary } from '@/lib/nutrition-coach'

interface NutritionCardProps {
  target:            NutritionTarget | null
  todayLogs:         FoodLog[]
  nutritionSummary?: NutritionCoachSummary  // Phase 1F addition
}

interface MacroBarProps {
  label:      string
  consumed:   number
  target:     number
  pct:        number
  remaining:  number
  isCalories?: boolean
}

function MacroBar({ label, consumed, target, pct, remaining, isCalories = false }: MacroBarProps) {
  const barColor = progressColor(pct, isCalories)
  const remColor = remainingColor(remaining)
  const unit     = isCalories ? '' : 'g'

  const fmt = (n: number) =>
    isCalories ? n.toLocaleString() : String(Math.round(n))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {fmt(consumed)}{unit}
          {' '}
          <span className="text-muted-foreground">/ {fmt(target)}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className={`text-xs ${remColor}`}>
        {remaining >= 0
          ? `${fmt(remaining)}${unit} remaining`
          : `${fmt(Math.abs(remaining))}${unit} over`}
      </p>
    </div>
  )
}

export function NutritionCard({ target, todayLogs, nutritionSummary }: NutritionCardProps) {
  // ── No target set ──────────────────────────────────────────────
  if (!target) {
    return (
      <div className="shred-card space-y-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Nutrition</span>
        </div>
        <p className="text-sm text-muted-foreground">No nutrition targets set.</p>
        <Link href="/nutrition" className="text-sm text-primary hover:underline">
          Set up targets →
        </Link>
      </div>
    )
  }

  // ── Today’s progress ───────────────────────────────────────────
  const todayDate = todayISO()
  const totals    = computeDailyTotals(todayLogs, todayDate)
  const nowHour   = new Date().getHours()
  const progress  = computeNutritionProgress(totals, target, nowHour)

  return (
    <div className="shred-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Nutrition</span>
        </div>
        <Link href="/food" className="text-xs text-primary hover:underline">
          Log food →
        </Link>
      </div>

      {/* No entries yet */}
      {todayLogs.length === 0 ? (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">No food logged yet today.</p>
          <p className="text-xs text-muted-foreground">
            Target: {target.calories.toLocaleString()} cal · {target.protein_g}g protein
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <MacroBar
            label="Calories"
            consumed={progress.calories.consumed}
            target={progress.calories.target}
            pct={progress.calories.pct}
            remaining={progress.calories.remaining}
            isCalories
          />
          <MacroBar
            label="Protein"
            consumed={Number(progress.protein_g.consumed)}
            target={progress.protein_g.target}
            pct={progress.protein_g.pct}
            remaining={Number(progress.protein_g.remaining)}
          />
          <MacroBar
            label="Carbs"
            consumed={Number(progress.carbs_g.consumed)}
            target={progress.carbs_g.target}
            pct={progress.carbs_g.pct}
            remaining={Number(progress.carbs_g.remaining)}
          />
          <MacroBar
            label="Fat"
            consumed={Number(progress.fat_g.consumed)}
            target={progress.fat_g.target}
            pct={progress.fat_g.pct}
            remaining={Number(progress.fat_g.remaining)}
          />
        </div>
      )}

      {/* Time-gated warnings (protein low late in day, calories over) */}
      {progress.warnings.map((w, i) => (
        <div
          key={i}
          className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2"
        >
          <p className="text-xs text-amber-400">{w}</p>
        </div>
      ))}

      {/* Structural low-carb warning from target */}
      {target.low_carb_warning && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-400">
            Carbs are low ({target.carbs_g}g). This may affect training energy. See{' '}
            <Link href="/nutrition" className="underline">
              Nutrition
            </Link>{' '}
            to adjust.
          </p>
        </div>
      )}

      {/* Phase 1F: compact coaching context (only when data exists) */}
      {nutritionSummary && nutritionSummary.loggedDaysLast7 > 0 && (
        <div className="pt-2 border-t border-border space-y-2">
          {/* Weekly logged days + average */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {nutritionSummary.loggedDaysLast7}/7 days logged
            </span>
            {nutritionSummary.avgCaloriesLast7 !== null && (
              <span className="tabular-nums text-muted-foreground">
                {nutritionSummary.avgCaloriesLast7.toLocaleString()} cal avg
              </span>
            )}
          </div>

          {/* Protein status pill — only shown when low or close */}
          {(nutritionSummary.proteinStatus === 'low' ||
            nutritionSummary.proteinStatus === 'close') && (
            <div>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  nutritionSummary.proteinStatus === 'low'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                Protein{' '}
                {nutritionSummary.proteinStatus === 'low' ? 'low' : 'slightly under'} this week
              </span>
            </div>
          )}

          {/* Single primary nudge */}
          {nutritionSummary.primaryNudge && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {nutritionSummary.primaryNudge}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
