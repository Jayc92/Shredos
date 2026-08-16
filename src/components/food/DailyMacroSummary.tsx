import { progressColor, remainingColor } from '@/lib/food'
import { ArrowRight } from 'lucide-react'
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

function BarRow({ label, consumed, target, pct, remaining, unit = 'g', isCalories = false }: BarRowProps) {
  const fillColor = FILL_TOKEN[progressColor(pct, isCalories).split('-')[1]] ?? 'bg-brand'
  const remColor  = REMAINING_TOKEN[remainingColor(remaining).split('-')[1]] ?? 'text-ink-muted'
  const cappedPct = Math.min(100, pct)

  return (
    // Hosted-QA correction: the remaining/over status previously sat
    // BELOW the bar, where it could visually associate with the next
    // macro. It is now a DOM sibling of the consumed/target value
    // inside the same right-aligned value block, ABOVE the bar —
    // label left, value block right, then the bar for the whole row.
    // All values, thresholds, and colors unchanged.
    <div className="space-y-1">
      <div className="flex items-start justify-between text-xs">
        <span className="text-ink-muted font-medium">{label}</span>
        <div className="text-right">
          <div className="tabular-nums text-ink">
            {isCalories ? consumed.toLocaleString() : consumed.toFixed(1)}{isCalories ? '' : unit}
            <span className="text-ink-muted"> / {isCalories ? target.toLocaleString() : target}{isCalories ? ' cal' : unit}</span>
          </div>
          <div className={remColor}>
            {remaining >= 0
              ? `${isCalories ? Math.abs(remaining).toLocaleString() : Math.abs(remaining).toFixed(1)}${isCalories ? ' cal' : unit} remaining`
              : `${isCalories ? Math.abs(remaining).toLocaleString() : Math.abs(remaining).toFixed(1)}${isCalories ? ' cal' : unit} over target`}
          </div>
        </div>
      </div>
      <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-300`}
          style={{ width: `${cappedPct}%` }}
        />
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
          <a href="/nutrition" className="inline-flex items-center gap-1 text-brand hover:underline">Set targets<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></a>
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
        <a href="/food" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">Log food<ArrowRight className="w-3 h-3" aria-hidden="true" /></a>
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
        <a href="/food" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
          Log food
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </CardContent>
    </Card>
  )
}
