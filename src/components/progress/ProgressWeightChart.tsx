// ============================================================
// ForgeFitOS — Progress weight trend chart (UI-4)
// Feature-scale area chart of REAL stored weigh-ins, following the
// established plain-SVG precedent (ExerciseTrendChart /
// WeeklyEnergyChart / WeightTrendChart): server component, viewBox
// responsive, semantic tokens, per-point <title>, sr-only text
// equivalent, no chart dependency, no client JS.
//
// Honesty contract:
//   - x positions are proportional to REAL days between readings —
//     gaps stay visibly irregular; nothing is interpolated as data
//   - points mark the observations; the line is a guide; the area
//     fill is the same guide encoded as a region (data encoding,
//     not decoration)
//   - the optional goal line comes ONLY from the profile's existing
//     goal weight and is drawn solely when it sits near the observed
//     range (never squashing real data to chase a distant goal)
//   - requires >= 2 readings; the card owns the 0/1-reading states
//     (one observation is never presented as a trend)
// ============================================================

interface WeightReading {
  /** ISO date (YYYY-MM-DD), ascending. */
  date: string
  lbs: number
  /** Preformatted label, e.g. "Jul 25". */
  label: string
}

const VIEW_W = 640
const VIEW_H = 220
const PAD_X = 44
const PAD_TOP = 14
const PAD_BOTTOM = 26
/** Minimum y-span (lbs) so small fluctuations aren't dramatized. */
const MIN_SPAN_LBS = 4
/** Draw the goal line only within this distance of the data range. */
const GOAL_PROXIMITY_LBS = 15

function dayOffset(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T12:00`).getTime() - new Date(`${from}T12:00`).getTime()) / 86_400_000
  )
}

export function ProgressWeightChart({
  readings,
  goalLbs = null,
}: {
  readings: WeightReading[]
  goalLbs?: number | null
}) {
  if (readings.length < 2) return null

  const first = readings[0]
  const last = readings[readings.length - 1]
  const totalDays = Math.max(1, dayOffset(first.date, last.date))

  let min = Math.min(...readings.map((r) => r.lbs))
  let max = Math.max(...readings.map((r) => r.lbs))
  // Include the goal in the domain only when it is close enough to the
  // observed range to be meaningful context rather than distortion.
  const showGoal =
    goalLbs !== null &&
    goalLbs > min - GOAL_PROXIMITY_LBS &&
    goalLbs < max + GOAL_PROXIMITY_LBS
  if (showGoal) {
    min = Math.min(min, goalLbs as number)
    max = Math.max(max, goalLbs as number)
  }
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

  const linePoints = readings
    .map((r) => `${x(r).toFixed(2)},${y(r.lbs).toFixed(2)}`)
    .join(' ')
  const baseY = (VIEW_H - PAD_BOTTOM).toFixed(2)
  const areaPoints = `${x(first).toFixed(2)},${baseY} ${linePoints} ${x(last).toFixed(2)},${baseY}`
  const summary = `Recorded body weight from ${first.label} to ${last.label}`

  return (
    <>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${summary}: ${readings.length} weigh-ins`}
        fill="none"
      >
        {/* y extremes (lbs) */}
        <text x={PAD_X - 6} y={y(max) + 3} textAnchor="end" fontSize={10}
          className="fill-muted-foreground">{Math.round(max)}</text>
        <text x={PAD_X - 6} y={y(min) + 3} textAnchor="end" fontSize={10}
          className="fill-muted-foreground">{Math.round(min)}</text>
        <line x1={PAD_X} y1={VIEW_H - PAD_BOTTOM} x2={VIEW_W - PAD_X}
          y2={VIEW_H - PAD_BOTTOM} className="stroke-border" strokeWidth="1" />

        {/* observed-trend region (guide encoding, not decoration) */}
        <polygon points={areaPoints} className="fill-primary" opacity="0.12" />
        <polyline points={linePoints} className="stroke-primary" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* goal context — existing profile goal only, clearly labeled */}
        {showGoal && (
          <g>
            <line x1={PAD_X} x2={VIEW_W - PAD_X}
              y1={y(goalLbs as number)} y2={y(goalLbs as number)}
              className="stroke-muted-foreground" strokeWidth="1.5"
              strokeDasharray="4 4" opacity="0.7" />
            <text x={VIEW_W - PAD_X} y={y(goalLbs as number) - 4} textAnchor="end"
              fontSize={10} className="fill-muted-foreground">
              Goal {Math.round(goalLbs as number)} lbs
            </text>
          </g>
        )}

        {/* observations */}
        {readings.map((r, i) => (
          <g key={r.date + i}>
            <circle cx={x(r)} cy={y(r.lbs)} r={3.5} className="fill-primary" />
            <circle cx={x(r)} cy={y(r.lbs)} r={11} fill="transparent">
              <title>{`${r.label}: ${r.lbs.toFixed(1)} lbs`}</title>
            </circle>
          </g>
        ))}

        {/* x labels: real first/last dates */}
        <text x={x(first)} y={VIEW_H - 8} textAnchor="start" fontSize={10}
          className="fill-muted-foreground">{first.label}</text>
        <text x={x(last)} y={VIEW_H - 8} textAnchor="end" fontSize={10}
          className="fill-muted-foreground">{last.label}</text>
      </svg>
      {/* Nonvisual equivalent: every recorded observation. */}
      <ul className="sr-only">
        {readings.map((r, i) => (
          <li key={`sr${i}`}>{r.label}: {r.lbs.toFixed(1)} lbs</li>
        ))}
      </ul>
      {/* A valid stored goal outside the plotted range is excluded
          from the plot (real observations own the scale) but never
          silently dropped — concise factual disclosure, no
          projection, no recommendation. */}
      {goalLbs !== null && !showGoal && (
        <p className="text-xs text-ink-muted">
          Goal: {Math.round(goalLbs)} lbs — outside the displayed scale.
        </p>
      )}
    </>
  )
}
