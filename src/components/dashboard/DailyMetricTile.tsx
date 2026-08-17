// ============================================================
// ForgeFitOS — Daily metric tile (UI-2)
// Compact Today tile for one daily metric (calories, protein —
// steps keeps its existing StepsCard, which this tile visually
// matches). PRESENTATIONAL ONLY: the page computes every number
// with the stable domain helpers and passes finished strings plus
// raw value/max for the domain-blind ProgressBar. Honest states:
//   - value null  -> the caller's missing copy (never a zero)
//   - target null -> value shown without a target or bar
//   - over target -> truthful value + the caller's over/remaining
//     line; the bar clamps visually but announces the true value
// Server component; the action is a plain link.
// ============================================================

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'

export function DailyMetricTile({
  icon: Icon,
  label,
  href,
  linkLabel,
  value,
  targetLine,
  barValue,
  barMax,
  barLabel,
  subline,
  missingText,
}: {
  icon: LucideIcon
  label: string
  href: string
  linkLabel: string
  /** Finished display value (e.g. "1,842"); null = not recorded. */
  value: string | null
  /** Finished target context (e.g. "/ 2,400 cal"); null = no target. */
  targetLine: string | null
  /** Raw numbers for the domain-blind bar; null hides/unavails it. */
  barValue: number | null
  barMax: number | null
  barLabel: string
  /** Finished support line (e.g. "558 remaining" / "120 over"). */
  subline: string | null
  /** Copy when value is null (caller-provided, never invented). */
  missingText: string
}) {
  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <span className="truncate text-sm font-medium text-ink-muted">{label}</span>
          </div>
          <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs text-brand hover:underline">
            {linkLabel}
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        {value === null ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">{missingText}</p>
            {targetLine && <p className="text-xs text-ink-muted">{targetLine}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-2xl font-bold tabular-nums text-ink">{value}</span>
              {targetLine && (
                <span className="text-xs tabular-nums text-ink-muted">{targetLine}</span>
              )}
            </p>
            {barMax !== null && (
              <ProgressBar value={barValue} max={barMax} size="sm" label={barLabel} />
            )}
            {subline && <p className="text-xs text-ink-muted">{subline}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
