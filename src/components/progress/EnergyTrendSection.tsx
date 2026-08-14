// ============================================================
// ForgeFitOS — Energy & Adherence trends section (Phase 5B.5)
// Server component: renders the finished ProgressEnergyViewModel —
// summary strip, weekly intake-vs-target chart, weekly weight-anchor
// chart, coverage table, activity context, maintenance summary, and
// the deterministic interpretation. Zero energy arithmetic happens
// here (the lib owns every number); range controls are plain links
// (?range=4|8|12) so no client JS is needed — scroll={false} keeps
// the viewport in place across the range swap (5B.5 correction: the
// Next.js Link default otherwise scrolls to the top of the page).
// No total-burn, no eat-back, no session-calorie displays —
// trajectory evidence only.
// ============================================================

import Link from 'next/link'
import { Gauge } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import WeeklyEnergyChart from '@/components/progress/WeeklyEnergyChart'
import type { EnergyChartSlot } from '@/components/progress/WeeklyEnergyChart'
import { ENERGY_RANGE_OPTIONS } from '@/lib/progress-energy'
import type { ProgressEnergyViewModel } from '@/lib/progress-energy'

interface EnergyTrendSectionProps {
  model: ProgressEnergyViewModel
  /** Preserved ?mode= filter so range links don't clobber it. */
  modeParam?: string | null
}

export function EnergyTrendSection({ model, modeParam }: EnergyTrendSectionProps) {
  const rangeHref = (weeks: number) =>
    `/progress?range=${weeks}${modeParam ? `&mode=${modeParam}` : ''}`

  // Intake chart slots: one per week, gaps honest, counts disclosed.
  // The dashed reference is the intake-comparison target (day-weighted
  // over the same qualifying days as the intake average); on weeks with
  // no qualifying intake it falls back to the active-target TIMELINE,
  // explicitly labeled as not an intake comparison. All target
  // arithmetic happens in the lib — this maps finished fields.
  const intakeSlots: EnergyChartSlot[] = model.intakeWeeks.map((w) => {
    const targetText =
      w.averageTargetCalories === null
        ? ''
        : w.hasTargetTransition && w.targetTransition
        ? ` · target changed from ${w.targetTransition.fromCalories.toLocaleString()} to ${w.targetTransition.toCalories.toLocaleString()} this week — compared against the ${w.averageTargetCalories.toLocaleString()} day-weighted average`
        : ` · target ${w.averageTargetCalories.toLocaleString()}`
    return {
      label: w.label,
      value: w.averageIntakeCalories,
      // Timeline fallback ONLY on weeks with no intake point — a
      // dashed segment beside an intake point always means the
      // day-weighted comparison target, never the week-end version.
      targetValue: w.averageTargetCalories ??
        (w.averageIntakeCalories === null ? w.activeTargetAtWeekEnd : null),
      targetTransition: w.hasTargetTransition,
      hollow: w.lowConfidence,
      detail: w.averageIntakeCalories === null
        ? `Week of ${w.label}: no completed food-log days` +
          (w.activeTargetAtWeekEnd !== null
            ? ` · active target ${w.activeTargetAtWeekEnd.toLocaleString()} (no intake comparison)`
            : '')
        : `Week of ${w.label}: ${w.averageIntakeCalories.toLocaleString()} average calories from ${w.qualifyingDays} completed day${w.qualifyingDays !== 1 ? 's' : ''}` +
          `${w.explicitDays > 0 ? ` (${w.explicitDays} marked finished)` : ''}` +
          targetText +
          `${w.lowConfidence ? ' · low confidence' : ''}`,
    }
  })

  // Weight chart slots: every range week as a slot; anchored weeks
  // get values, missing weeks stay honest gaps at real spacing.
  const anchorByWeek = new Map(model.weightAnchors.map((a) => [a.weekStart, a]))
  const weightSlots: EnergyChartSlot[] = model.intakeWeeks.map((w) => {
    const anchor = anchorByWeek.get(w.weekStart)
    return {
      label: w.label,
      value: anchor?.anchorLbs ?? null,
      hollow: anchor ? anchor.quality === 'single' : false,
      detail: anchor
        ? `Week of ${w.label}: ${anchor.anchorLbs.toFixed(1)} lbs from ${anchor.contributingDates} weigh-in${anchor.contributingDates !== 1 ? 's' : ''}` +
          (anchor.quality === 'single' ? ' (single reading)' : ' (weekly average)')
        : `Week of ${w.label}: no weigh-in`,
    }
  })
  // Derived trend endpoints only when the stable regression exists.
  const firstAnchor = model.weightAnchors[0]
  const lastAnchor = model.weightAnchors[model.weightAnchors.length - 1]
  const weightTrendLine =
    model.weightTrend.weeklyRateLb !== null && firstAnchor && lastAnchor
      ? (() => {
          const firstIdx = model.intakeWeeks.findIndex((w) => w.weekStart === firstAnchor.weekStart)
          const lastIdx = model.intakeWeeks.findIndex((w) => w.weekStart === lastAnchor.weekStart)
          if (firstIdx < 0 || lastIdx <= firstIdx) return null
          const rate = model.weightTrend.weeklyRateLb as number
          // Anchor the derived line to the regression rate across the
          // FULL slot span so its slope matches real week spacing.
          const midValue = (firstAnchor.anchorLbs + lastAnchor.anchorLbs) / 2
          const midIdx = (firstIdx + lastIdx) / 2
          const startValue = midValue - rate * (midIdx - 0)
          const endValue = midValue + rate * (model.intakeWeeks.length - 1 - midIdx)
          return { startValue, endValue }
        })()
      : null

  const summaryRows: Array<[string, string]> = [
    ['Weight trajectory', model.summary.weightTrajectory],
    ['Calorie adherence', model.summary.calorieAdherence],
    ['Logging coverage', model.summary.loggingCoverage],
    ['Activity', model.summary.activity],
    ['Maintenance', model.summary.maintenance],
  ]

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-ink-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">Energy &amp; adherence</h2>
          <span className="text-xs text-ink-muted">{model.rangeLabel}</span>
        </div>
        {/* Range controls: plain links, usable at any width. */}
        <div className="flex items-center gap-1" role="group" aria-label="Time range">
          {ENERGY_RANGE_OPTIONS.map((weeks) => (
            <Link
              key={weeks}
              href={rangeHref(weeks)}
              scroll={false}
              aria-current={model.rangeWeeks === weeks ? 'true' : undefined}
              className={cn(
                'px-2.5 py-1.5 min-h-9 inline-flex items-center rounded-lg border text-xs font-medium transition-colors',
                model.rangeWeeks === weeks
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-edge text-ink-muted hover:bg-surface-sunken'
              )}
            >
              {weeks}w
            </Link>
          ))}
        </div>
      </div>

      {/* Summary strip — stacked compact rows, honest states. */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
          {summaryRows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-ink-muted">{label}</span>
              <span className="text-xs font-medium text-ink text-right">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Deterministic interpretation — plain language, no codes. */}
      {model.interpretation.length > 0 && (
        <Card variant="subtle" className="gap-0 py-3">
          <CardContent className="space-y-1">
            {model.interpretation.map((line) => (
              <p key={line} className="text-xs text-ink-muted">{line}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <WeeklyEnergyChart
        title="Weekly calories vs target"
        unit="calories"
        slots={intakeSlots}
        summary={
          intakeSlots.some((s) => s.value !== null)
            ? 'Average intake on completed food-log days, against the target that was active each week.'
            : 'No completed food-log days in this range yet — mark days as finished to build this trend.'
        }
        legend={[
          'Solid: 4+ completed days',
          'Hollow: fewer completed days (low confidence)',
          'Dashed: target (day-weighted average when it changed mid-week)',
          ...(model.intakeWeeks.some((w) => w.hasTargetTransition)
            ? ['Diamond: mid-week target change']
            : []),
        ]}
        footnote="Partial and missing days never count as intake — a week with no completed days is a gap, not a low point."
      />

      <WeeklyEnergyChart
        title="Weekly weight"
        unit="lbs"
        slots={weightSlots}
        trendLine={weightTrendLine}
        summary={
          model.weightAnchors.length === 0
            ? 'No weigh-ins in this range yet — one per week is enough to build the trend.'
            : model.weightTrend.weeklyRateLb !== null
            ? `Trend ${model.weightTrend.weeklyRateLb > 0 ? '+' : ''}${model.weightTrend.weeklyRateLb} lb/week across ${model.weightTrend.anchorCount} weekly anchors — ${model.trajectory.label.toLowerCase()} for your goal.`
            : `${model.weightAnchors.length} weekly anchor${model.weightAnchors.length !== 1 ? 's' : ''} so far — one more weekly weigh-in unlocks the trend.`
        }
        legend={[
          'Solid: weekly average (2+ weigh-ins)',
          'Hollow: single weigh-in',
          'Dashed: derived trend',
        ]}
        footnote="Missing weeks stay empty — anchors are never fabricated, and one weigh-in per week is a valid data point."
      />

      {/* Coverage table — why confidence is what it is. */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Logging coverage</h3>
          <div className="space-y-1">
            {model.intakeWeeks.map((w) => (
              <div key={w.weekStart} className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-ink-muted">Week of {w.label}</span>
                <span className="text-xs text-ink text-right">
                  {w.qualifyingDays === 0
                    ? 'No completed days'
                    : `${w.qualifyingDays} completed day${w.qualifyingDays !== 1 ? 's' : ''}` +
                      (w.explicitDays > 0 ? ` (${w.explicitDays} marked finished)` : '')}
                  {w.qualifyingDays >= 4
                    ? ' · strong coverage'
                    : w.qualifyingDays > 0
                    ? ' · more completed days needed'
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity + maintenance summaries — current context only. */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-ink-muted">Activity vs your baseline</span>
            <span className="text-xs font-medium text-ink text-right">{model.summary.activity}</span>
          </div>
          {model.activity.recentWeekAvgSteps !== null && model.activity.baselineMedianSteps !== null && (
            <p className="text-xs text-ink-muted">
              Last week averaged {model.activity.recentWeekAvgSteps.toLocaleString()} recorded steps/day
              against your usual {model.activity.baselineMedianSteps.toLocaleString()}.
            </p>
          )}
          <div className="flex items-baseline justify-between gap-3 pt-1">
            <span className="text-xs text-ink-muted">Maintenance estimate</span>
            <span className="text-xs font-medium text-ink text-right">{model.maintenance.note}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
