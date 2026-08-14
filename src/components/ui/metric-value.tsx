import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — MetricValue primitive (UI-1B)
// Domain-blind numeric display: value, optional unit, optional
// supporting label, optional trend slot. Tabular numerals prevent
// layout shift. Performs NO calculation, formatting, or trend
// classification — callers pass finished, already-formatted
// strings/nodes (the domain libs own every number).
// ============================================================

export function MetricValue({
  value,
  unit,
  label,
  trend,
  size = 'default',
  className,
}: {
  /** Already-formatted value node (e.g. "8,643"). */
  value: React.ReactNode
  /** Short unit rendered after the value (e.g. "lbs", "kcal"). */
  unit?: React.ReactNode
  /** Supporting label rendered under the value. */
  label?: React.ReactNode
  /** Caller-classified trend node (e.g. a delta with its own text). */
  trend?: React.ReactNode
  size?: 'default' | 'lg'
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span
          className={cn(
            'font-semibold text-ink font-stat',
            size === 'lg' ? 'text-3xl' : 'text-2xl'
          )}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-ink-muted">{unit}</span>}
        {trend && <span className="text-xs">{trend}</span>}
      </div>
      {label && <p className="text-support mt-0.5">{label}</p>}
    </div>
  )
}
