// ============================================================
// ShredOS — NutritionCard
// Phase 1B: real-time today vs target progress bars
// Phase 1F: optional coaching context (weekly summary + nudge)
// UI-2: calories and protein moved to the Today metric tiles. The
// page derives the tile figures with the SAME pure helpers and the
// SAME inputs (computeDailyTotals + computeNutritionProgress on
// todayLogs/target), so per-metric numbers and targets appear
// exactly once. This card keeps carbs/fat detail, time-gated warnings,
// day-completion context, and the 1F coaching footer — nothing was
// dropped, only relocated. Warning surfaces now use the semantic
// caution/critical tokens (dark theme) instead of raw palette
// colors; copy unchanged.
// ============================================================

import { UtensilsCrossed } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { computeDailyTotals, computeNutritionProgress, progressColor, remainingColor } from '@/lib/food'
import { localTodayFromCookies, localHourFromCookies } from '@/lib/local-date-server'
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

// UI-6A hosted-QA correction (macro-fill visibility): lib/food's
// progressColor/remainingColor return legacy literal palette
// classes, but Tailwind's content globs scan only src/app,
// src/components, and src/pages — never src/lib — so those
// utilities exist in the compiled stylesheet only while some
// scanned file repeats the same literals. The UI-6A token sweep
// removed the last scanned copies and every bar fill silently lost
// its background. This SCANNED component therefore owns the
// mapping from the lib's status literals to the semantic tokens the
// stylesheet actually ships; the lib's thresholds and status
// meaning are untouched (over -> critical, near -> caution,
// on-track calories -> success, macro grams -> info).
// Keyed on the hue word extracted from the lib's class string (the
// second dash-separated segment, e.g. red / amber / green / blue /
// muted) so no legacy class literal reappears anywhere in this
// scanned file — Tailwind scans raw text including comments, and a
// literal would re-emit the dead utility and regress the
// raw-palette ban.
const FILL_TOKEN: Record<string, string> = {
  red:   'bg-critical',
  amber: 'bg-caution',
  green: 'bg-success',
  blue:  'bg-info',
}
const REMAINING_TOKEN: Record<string, string> = {
  red:   'text-critical',
  amber: 'text-caution',
  muted: 'text-ink-muted',
}

function MacroBar({ label, consumed, target, pct, remaining, isCalories = false }: MacroBarProps) {
  const barColor = FILL_TOKEN[progressColor(pct, isCalories).split('-')[1]] ?? 'bg-brand'
  const remColor = REMAINING_TOKEN[remainingColor(remaining).split('-')[1]] ?? 'text-ink-muted'
  const unit     = isCalories ? '' : 'g'

  const fmt = (n: number) =>
    isCalories ? n.toLocaleString() : String(Math.round(n))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="tabular-nums text-ink">
          {fmt(consumed)}{unit}
          {' '}
          <span className="text-ink-muted">/ {fmt(target)}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
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
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-ink-muted" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-muted">Nutrition</span>
          </div>
          <p className="text-sm text-ink-muted">No nutrition targets set.</p>
          <Link href="/nutrition" className="text-sm text-brand hover:underline">
            Set up targets →
          </Link>
        </CardContent>
      </Card>
    )
  }

  // ── Today’s progress ───────────────────────────────────────────
  // Local-date fix: user-local day/hour (timezone cookie), not UTC.
  const todayDate = localTodayFromCookies()
  const totals    = computeDailyTotals(todayLogs, todayDate)
  const nowHour   = localHourFromCookies()
  const progress  = computeNutritionProgress(totals, target, nowHour)

  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-muted">Nutrition details</span>
        </div>
        <Link href="/food" className="text-xs text-brand hover:underline">
          Log food →
        </Link>
      </div>

      {/* No entries yet */}
      {todayLogs.length === 0 ? (
        <div className="space-y-1">
          <p className="text-sm text-ink-muted">No food logged yet today.</p>
          <p className="text-xs text-ink-muted">
            Target: {target.calories.toLocaleString()} cal · {target.protein_g}g protein
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* UI-2: Calories + Protein render as the Today metric
              tiles (same progress object, computed once by the
              page); carbs/fat stay here as the detail view. */}
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

      {/* Time-gated warnings — only when food has actually been logged */}
      {todayLogs.length > 0 && progress.warnings.map((w, i) => (
        <div
          key={i}
          className="bg-caution-subtle border border-edge rounded-lg px-3 py-2"
        >
          <p className="text-xs text-caution">{w}</p>
        </div>
      ))}

      {/* Structural low-carb warning from target */}
      {target.low_carb_warning && (
        <div className="bg-caution-subtle border border-edge rounded-lg px-3 py-2">
          <p className="text-xs text-caution">
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
        <div className="pt-2 border-t border-edge-subtle space-y-2">
          {/* Weekly logged days + average */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">
              {nutritionSummary.loggedDaysLast7}/7 days logged
            </span>
            {nutritionSummary.avgCaloriesLast7 !== null && (
              <span className="tabular-nums text-ink-muted">
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
                    ? 'bg-critical-subtle text-critical'
                    : 'bg-caution-subtle text-caution'
                }`}
              >
                Protein{' '}
                {nutritionSummary.proteinStatus === 'low' ? 'low' : 'slightly under'} this week
              </span>
            </div>
          )}

          {/* Single primary nudge */}
          {nutritionSummary.primaryNudge && (
            <p className="text-xs text-ink-muted leading-relaxed">
              {nutritionSummary.primaryNudge}
            </p>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
