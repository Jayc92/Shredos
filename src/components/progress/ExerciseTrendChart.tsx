// ============================================================
// ShredOS — ExerciseTrendChart (Phase 2W)
// Generic, domain-blind trend chart. Receives already-normalized
// TrendPoint arrays from lib/progress-charts.ts — it knows nothing
// about exercises, tracking modes, or database shapes, and performs
// no domain math beyond linear scaling.
//
// Deliberately a server component rendering plain SVG:
//   - no chart library (audited: none installed; one small line
//     chart doesn't justify a dependency)
//   - responsive via viewBox + width:100%
//   - deterministic output (fixed-precision coordinates, no
//     randomness, no Date.now()) → no hydration concerns
//   - native <svg><title> tooltips on enlarged invisible hit
//     targets — no client JS, no interaction library
//   - colors come only from the existing design tokens
//     (stroke-primary / fill-primary / stroke-border /
//     fill-muted-foreground), so light/dark theming is automatic
//     and the chart is never the sole carrier of meaning: the
//     title, text summary, axis labels, and tooltips restate it.
// No zooming, brushing, or animation — intentionally out of scope.
// ============================================================

import type { TrendPoint } from '@/lib/progress-charts'
import { EMPTY_TREND_MESSAGE } from '@/lib/progress-charts'
import { Card, CardContent } from '@/components/ui/card'

interface ExerciseTrendChartProps {
  title: string
  /** Chronological points, oldest → newest. Fewer than 2 → empty state. */
  points: TrendPoint[]
  /** First-to-latest text summary, e.g. "Up 8 lbs across 4 sessions". */
  summary?: string
  /** Orientation note, e.g. "Lower is faster" for pace. */
  footnote?: string
  /** Smaller plot for secondary charts (added weight, distance). */
  compact?: boolean
  /**
   * Optional minimum y-domain span, in the same unit as point values
   * (Phase 2Y). When the data range is narrower, the domain expands
   * symmetrically around its midpoint so tiny fluctuations aren't
   * exaggerated to full plot height — used by the body-weight chart
   * (~2 lbs). Omitted by every exercise chart, whose scaling is
   * unchanged.
   */
  minVisibleRange?: number
}

const VIEW_WIDTH = 600
const PAD_LEFT = 56 // hosts the min/max value labels
const PAD_RIGHT = 14
const PAD_TOP = 12
const PAD_BOTTOM = 26 // hosts the date labels
const LABEL_FONT_SIZE = 10

export default function ExerciseTrendChart({
  title,
  points,
  summary,
  footnote,
  compact = false,
  minVisibleRange,
}: ExerciseTrendChartProps) {
  if (points.length < 2) {
    return (
      <Card variant="subtle" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-muted">{EMPTY_TREND_MESSAGE}</p>
      </CardContent>
      </Card>
    )
  }

  const viewHeight = compact ? 140 : 200
  const innerWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT
  const innerHeight = viewHeight - PAD_TOP - PAD_BOTTOM

  const values = points.map((p) => p.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const isFlat = maxValue === minValue

  // A flat series still deserves a visible centered line: pad the
  // domain artificially so the line sits mid-plot instead of on an
  // edge. The pad is display-only; values and labels are untouched.
  let domainMin = isFlat ? minValue - Math.max(1, minValue * 0.05) : minValue
  let domainMax = isFlat ? maxValue + Math.max(1, maxValue * 0.05) : maxValue

  // Phase 2Y: optional minimum visible range — expand a too-narrow
  // domain symmetrically so small fluctuations aren't visually
  // exaggerated. No caller-omitted behavior changes (exercise charts
  // never pass it), and the flat-series pad above already guarantees
  // domainMax > domainMin, so scaling can never divide by zero.
  if (minVisibleRange !== undefined && domainMax - domainMin < minVisibleRange) {
    const midpoint = (domainMax + domainMin) / 2
    domainMin = midpoint - minVisibleRange / 2
    domainMax = midpoint + minVisibleRange / 2
  }

  const xAt = (index: number): number =>
    PAD_LEFT + (points.length === 1 ? 0 : (index / (points.length - 1)) * innerWidth)
  const yAt = (value: number): number =>
    PAD_TOP + (1 - (value - domainMin) / (domainMax - domainMin)) * innerHeight

  const coords = points.map((p, i) => ({
    x: Number(xAt(i).toFixed(1)),
    y: Number(yAt(p.value).toFixed(1)),
  }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x} ${c.y}`).join(' ')

  // Axis reference lines + value labels at the data min and max (one
  // centered line when flat). Labels reuse the points' own
  // displayValues, so the generic chart never formats domain values.
  const maxPoint = points.reduce((best, p) => (p.value > best.value ? p : best), points[0])
  const minPoint = points.reduce((best, p) => (p.value < best.value ? p : best), points[0])
  const gridLines = isFlat
    ? [{ y: yAt(minValue), label: minPoint.displayValue }]
    : [
        { y: yAt(maxValue), label: maxPoint.displayValue },
        { y: yAt(minValue), label: minPoint.displayValue },
      ]

  // Concise date labels: first, last, and (when 3+ points) middle.
  const labelIndexes = new Set<number>([0, points.length - 1])
  if (points.length >= 3) labelIndexes.add(Math.floor((points.length - 1) / 2))

  const description = `${title} trend from ${points[0].dateLabel} (${points[0].displayValue}) to ${
    points[points.length - 1].dateLabel
  } (${points[points.length - 1].displayValue}), ${points.length} sessions.${
    summary ? ` ${summary}.` : ''
  }`

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {summary && <p className="text-xs text-ink-muted mt-0.5">{summary}</p>}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
        width="100%"
        role="img"
        aria-label={`${title} trend chart: ${summary ?? `${points.length} sessions`}`}
        className="block"
      >
        <desc>{description}</desc>

        {/* Recessive reference lines at the data min/max */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              x2={VIEW_WIDTH - PAD_RIGHT}
              y1={line.y}
              y2={line.y}
              className="stroke-border"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <text
              x={PAD_LEFT - 8}
              y={line.y + 3}
              textAnchor="end"
              fontSize={LABEL_FONT_SIZE}
              className="fill-muted-foreground tabular-nums"
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Date labels */}
        {points.map((p, i) =>
          labelIndexes.has(i) ? (
            <text
              key={`d${i}`}
              x={coords[i].x}
              y={viewHeight - 8}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              fontSize={LABEL_FONT_SIZE}
              className="fill-muted-foreground"
            >
              {p.dateLabel}
            </text>
          ) : null
        )}

        {/* Trend line */}
        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Point markers, each with an enlarged invisible hit target
            carrying a native tooltip */}
        {points.map((p, i) => (
          <g key={`p${i}`}>
            <circle
              cx={coords[i].x}
              cy={coords[i].y}
              r={4}
              className="fill-primary stroke-card"
              strokeWidth={2}
            />
            <circle cx={coords[i].x} cy={coords[i].y} r={11} fill="transparent">
              <title>
                {`${p.dateLabel} — ${p.displayValue}${
                  p.secondaryLabel ? ` · ${p.secondaryLabel}` : ''
                }`}
              </title>
            </circle>
          </g>
        ))}
      </svg>

      {footnote && <p className="text-xs text-ink-muted">{footnote}</p>}
    </CardContent>
    </Card>
  )
}
