import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — ProgressRing primitive (UI-1B)
// Domain-blind determinate SVG ring. Server component: plain SVG,
// no client JavaScript, no animation dependency (static geometry is
// reduced-motion safe by construction).
//
// Honesty contract (mirrors ProgressBar):
//   - value null/undefined/NaN or invalid max = UNAVAILABLE: a
//     dashed track, no progress arc, data-state="unavailable", and
//     an accessible "not available" label — never rendered as zero.
//   - zero = valid: full track, no arc, aria/text say "0 of max".
//   - complete = full arc; value > max renders the full arc and
//     sets data-state="over"; the true value is always announced
//     (aria-label + <title>), never disguised by the clamp.
//   - No nutrition, fasting, or any domain calculation inside: the
//     only math is circle geometry and presentation clamping.
//   - Meaning is never color-alone: the accessible name/value and
//     the caller's adjacent text carry the state.
// ============================================================

export function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  label,
  className,
}: {
  /** Current value; null/undefined = honestly unavailable. */
  value: number | null | undefined
  /** Positive maximum; invalid max makes the ring unavailable. */
  max?: number
  /** Rendered square size in CSS pixels. */
  size?: number
  strokeWidth?: number
  /** Required accessible name (e.g. "Fast progress"). */
  label: string
  className?: string
}) {
  const valid =
    typeof value === 'number' && Number.isFinite(value) &&
    typeof max === 'number' && Number.isFinite(max) && max > 0
  const pct = valid ? Math.min(100, Math.max(0, ((value as number) / max) * 100)) : 0
  const over = valid && (value as number) > max
  const state = !valid ? 'unavailable' : over ? 'over' : 'determinate'

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct / 100)
  const text = valid ? `${label}: ${value} of ${max}` : `${label}: not available`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={text}
      data-state={state}
      className={cn('shrink-0', className)}
      fill="none"
    >
      <title>{text}</title>
      {/* Track: solid when a value exists, dashed when unavailable —
          the missing state is visually distinct from zero progress. */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-edge-subtle"
        strokeDasharray={valid ? undefined : '3 5'}
      />
      {/* Progress arc — only for valid values with progress. */}
      {valid && pct > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="stroke-brand"
        />
      )}
    </svg>
  )
}
