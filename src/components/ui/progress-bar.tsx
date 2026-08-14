import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — ProgressBar primitive (UI-1B)
// Domain-blind determinate progress track. Server component.
//
// Honesty contract:
//   - value null/undefined/NaN, or max invalid (<= 0 / NaN), is the
//     UNAVAILABLE state: dimmed empty track, NO aria-valuenow (the
//     progressbar reads as indeterminate/"Not available"), and
//     data-state="unavailable" — a missing value NEVER renders as
//     zero progress (zero is a valid value with a 0-width fill and
//     aria-valuenow=0).
//   - Rendering clamps the fill to 0–100% so layout never breaks,
//     but the TRUE caller value is never disguised: aria-valuetext
//     always announces the actual value, and value > max sets
//     data-state="over" for callers/tests. Meaning is never carried
//     by color alone — the accessible name + value semantics (and
//     the caller's own adjacent text) carry the state.
//   - No calorie, macro, step, adherence, or any domain arithmetic:
//     the only math is presentation clamping.
// ============================================================

const SIZES = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-2.5',
} as const

export function ProgressBar({
  value,
  max = 100,
  label,
  size = 'md',
  className,
}: {
  /** Current value; null/undefined = honestly unavailable. */
  value: number | null | undefined
  /** Positive maximum; invalid max makes the bar unavailable. */
  max?: number
  /** Required accessible name (e.g. "Steps toward goal"). */
  label: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const valid =
    typeof value === 'number' && Number.isFinite(value) &&
    typeof max === 'number' && Number.isFinite(max) && max > 0
  const pct = valid ? Math.min(100, Math.max(0, ((value as number) / max) * 100)) : 0
  const over = valid && (value as number) > max
  const state = !valid ? 'unavailable' : over ? 'over' : 'determinate'

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={valid ? 0 : undefined}
      aria-valuemax={valid ? max : undefined}
      // aria-valuenow stays within [0, max] per ARIA; the true value
      // is carried by aria-valuetext below.
      aria-valuenow={valid ? Math.min(max, Math.max(0, value as number)) : undefined}
      aria-valuetext={valid ? `${value} of ${max}` : 'Not available'}
      data-state={state}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-sunken',
        SIZES[size],
        state === 'unavailable' && 'opacity-50',
        className
      )}
    >
      {valid && (
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  )
}
