// ============================================================
// ForgeFitOS — Weight trend chart (UI-2)
// Domain-specific server SVG for the Today weight card, following
// the established plain-SVG precedent (ExerciseTrendChart /
// WeeklyEnergyChart): viewBox-responsive, deterministic, semantic
// tokens, native <title> per point, sr-only text equivalent, no
// chart dependency, no client JS.
//
// Honesty contract:
//   - x positions are proportional to the REAL days between
//     readings — irregular gaps stay visibly irregular
//   - only actual recorded readings render points; the connecting
//     line is a reading-to-reading guide, points mark observations,
//     and missing dates are never fabricated or interpolated as data
//   - requires >= 2 readings (the card handles 0/1-reading states)
// ============================================================

interface WeightReading {
  /** ISO date (YYYY-MM-DD), ascending. */
  date: string
  lbs: number
  /** Preformatted label, e.g. "Jul 25". */
  label: string
}

const VIEW_W = 560
const VIEW_H = 150
const PAD_X = 40
const PAD_TOP = 12
const PAD_BOTTOM = 22
/** Minimum visible y-span (lbs) so tiny fluctuations aren't dramatized. */
const MIN_SPAN_LBS = 4

function dayOffset(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T12:00`).getTime() - new Date(`${from}T12:00`).getTime()) / 86_400_000
  )
}

export function WeightTrendChart({ readings }: { readings: WeightReading[] }) {
  if (readings.length < 2) return null

  const first = readings[0]
  const last = readings[readings.length - 1]
  const totalDays = Math.max(1, dayOffset(first.date, last.date))

  let min = Math.min(...readings.map((r) => r.lbs))
  let max = Math.max(...readings.map((r) => r.lbs))
  if (max - min < MIN_SPAN_LBS) {
    const mid = (max + min) / 2
    min = mid - MIN_SPAN_LBS / 2
    max = mid + MIN_SPAN_LBS / 2
  }
  const span = max - min

  const plotW = VIEW_W - PAD_X * 2
  const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM
  const x = (r: WeightReading) =>
    PAD_X + (dayOffset(first.date, r.date) / totalDays) * plotW
  const y = (lbs: number) => PAD_TOP + (1 - (lbs - min) / span) * plotH

  const linePoints = readings.map((r) => `${x(r).toFixed(2)},${y(r.lbs).toFixed(2)}`).join(' ')
  const summary = `Weight readings from ${first.label} to ${last.label}`

  return (
    <>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${summary}: ${readings.length} recorded weigh-ins`}
        fill="none"
      >
        {/* y extremes */}
        <text x={PAD_X - 6} y={y(max) + 3} textAnchor="end" fontSize={10}
          className="fill-muted-foreground">{Math.round(max)}</text>
        <text x={PAD_X - 6} y={y(min) + 3} textAnchor="end" fontSize={10}
          className="fill-muted-foreground">{Math.round(min)}</text>
        <line x1={PAD_X} y1={VIEW_H - PAD_BOTTOM} x2={VIEW_W - PAD_X}
          y2={VIEW_H - PAD_BOTTOM} className="stroke-border" strokeWidth="1" />

        {/* reading-to-reading guide line (points are the data) */}
        <polyline points={linePoints} className="stroke-primary" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />

        {/* observed readings */}
        {readings.map((r, i) => (
          <g key={r.date + i}>
            <circle cx={x(r)} cy={y(r.lbs)} r={3.5} className="fill-primary" />
            <circle cx={x(r)} cy={y(r.lbs)} r={11} fill="transparent">
              <title>{`${r.label}: ${r.lbs.toFixed(1)} lbs`}</title>
            </circle>
          </g>
        ))}

        {/* x labels: first and last real dates */}
        <text x={x(first)} y={VIEW_H - 6} textAnchor="start" fontSize={10}
          className="fill-muted-foreground">{first.label}</text>
        <text x={x(last)} y={VIEW_H - 6} textAnchor="end" fontSize={10}
          className="fill-muted-foreground">{last.label}</text>
      </svg>
      {/* Nonvisual equivalent: every recorded reading. */}
      <ul className="sr-only">
        {readings.map((r, i) => (
          <li key={`sr${i}`}>{r.label}: {r.lbs.toFixed(1)} lbs</li>
        ))}
      </ul>
    </>
  )
}
