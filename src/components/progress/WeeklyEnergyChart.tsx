// ============================================================
// ForgeFitOS — WeeklyEnergyChart (Phase 5B.5)
// Domain-blind weekly slot chart following the ExerciseTrendChart
// precedent exactly: a server component rendering plain SVG (no
// chart library — audited again: none installed, and two small
// weekly charts don't justify a dependency), responsive via
// viewBox, deterministic output, design-token colors only, native
// <svg><title> tooltips, and a visually-hidden text list so every
// value has an accessible text equivalent.
//
// The x axis is ONE SLOT PER WEEK across the whole range — weeks
// without a value stay as empty slots, so gaps are honest and week
// spacing is always real. Meaning is never carried by color alone:
// low-confidence intake points are hollow AND disclosed in text;
// single-reading anchors are hollow AND labeled in text.
// No energy arithmetic happens here: slots arrive fully computed.
// ============================================================

import { Card, CardContent } from '@/components/ui/card'

export interface EnergyChartSlot {
  /** Compact week label, e.g. "Jul 27". */
  label: string
  /** Primary value for the week; null = honest gap (no mark). */
  value: number | null
  /** Optional reference value: the intake-comparison target for the
   *  week (day-weighted average when it changed mid-week), or the
   *  active-target timeline on weeks with no qualifying intake. */
  targetValue?: number | null
  /** The target changed mid-week: draws a small diamond marker on
   *  the target segment. The slot's detail text carries the
   *  old/new disclosure — this component does no target math. */
  targetTransition?: boolean
  /** Render the point hollow + smaller (low-confidence intake or
   *  single-reading anchor). */
  hollow?: boolean
  /** Full-text tooltip/accessible description for the week. */
  detail: string
}

interface WeeklyEnergyChartProps {
  title: string
  unit: string
  /** One slot per week, oldest → newest, gaps included. */
  slots: EnergyChartSlot[]
  /** Optional derived trend endpoints (drawn dashed, labeled as a
   *  derived line — only pass when evidence supports a trend). */
  trendLine?: { startValue: number; endValue: number } | null
  /** Plain-language summary rendered above the plot. */
  summary: string
  footnote?: string
  /** Legend entries, e.g. "Solid: multi-reading week". */
  legend?: string[]
}

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 200
const PAD_LEFT = 56
const PAD_RIGHT = 14
const PAD_TOP = 12
const PAD_BOTTOM = 26
const LABEL_FONT_SIZE = 10
/** Minimum y-span so small fluctuations aren't exaggerated (the 2Y
 *  precedent) — in the value's own unit. */
const MIN_VISIBLE_FRACTION = 0.06

export default function WeeklyEnergyChart({
  title,
  unit,
  slots,
  trendLine = null,
  summary,
  footnote,
  legend,
}: WeeklyEnergyChartProps) {
  const values = slots.flatMap((s) => [
    ...(s.value !== null ? [s.value] : []),
    ...(s.targetValue !== null && s.targetValue !== undefined ? [s.targetValue] : []),
  ])
  const trendValues = trendLine ? [trendLine.startValue, trendLine.endValue] : []
  const all = [...values, ...trendValues]

  if (values.length === 0) {
    return (
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="text-sm text-ink-muted">{summary}</p>
        </CardContent>
      </Card>
    )
  }

  let min = Math.min(...all)
  let max = Math.max(...all)
  const midpoint = (min + max) / 2
  const minSpan = Math.max(1, Math.abs(midpoint) * MIN_VISIBLE_FRACTION)
  if (max - min < minSpan) {
    min = midpoint - minSpan / 2
    max = midpoint + minSpan / 2
  }
  const span = max - min

  const plotWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM
  const slotX = (i: number) =>
    PAD_LEFT + (slots.length === 1 ? plotWidth / 2 : (i / (slots.length - 1)) * plotWidth)
  const valueY = (v: number) => PAD_TOP + (1 - (v - min) / span) * plotHeight
  const fmt = (v: number) => Math.round(v).toLocaleString()

  // Target step-line segments (horizontal per week, stepping at
  // changes — the historical target for each week, never smoothed).
  const targetSegments: Array<{ x1: number; x2: number; y: number }> = []
  slots.forEach((s, i) => {
    if (s.targetValue === null || s.targetValue === undefined) return
    const y = valueY(s.targetValue)
    const halfSlot = slots.length > 1 ? plotWidth / (slots.length - 1) / 2 : plotWidth / 2
    targetSegments.push({
      x1: Math.max(PAD_LEFT, slotX(i) - halfSlot),
      x2: Math.min(VIEW_WIDTH - PAD_RIGHT, slotX(i) + halfSlot),
      y,
    })
  })

  // Sparse x labels: first, last, and roughly every other in between.
  const labelEvery = slots.length > 8 ? 2 : 1

  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="text-xs text-ink-muted">{summary}</p>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${title}: ${summary}`}
        >
          {/* y extremes */}
          <text x={PAD_LEFT - 6} y={valueY(max) + 3} textAnchor="end"
            fontSize={LABEL_FONT_SIZE} className="fill-muted-foreground">{fmt(max)}</text>
          <text x={PAD_LEFT - 6} y={valueY(min) + 3} textAnchor="end"
            fontSize={LABEL_FONT_SIZE} className="fill-muted-foreground">{fmt(min)}</text>
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={VIEW_HEIGHT - PAD_BOTTOM}
            className="stroke-border" strokeWidth="1" />
          <line x1={PAD_LEFT} y1={VIEW_HEIGHT - PAD_BOTTOM} x2={VIEW_WIDTH - PAD_RIGHT}
            y2={VIEW_HEIGHT - PAD_BOTTOM} className="stroke-border" strokeWidth="1" />

          {/* historical target step-line */}
          {targetSegments.map((seg, i) => (
            <line key={`t${i}`} x1={seg.x1} x2={seg.x2} y1={seg.y} y2={seg.y}
              className="stroke-muted-foreground" strokeWidth="1.5" strokeDasharray="2 3" />
          ))}

          {/* mid-week target-change markers (diamond on the segment) */}
          {slots.map((s, i) =>
            s.targetTransition && s.targetValue !== null && s.targetValue !== undefined ? (
              <path
                key={`tt${i}`}
                d={`M ${slotX(i)} ${valueY(s.targetValue) - 5} L ${slotX(i) + 4} ${valueY(s.targetValue)} L ${slotX(i)} ${valueY(s.targetValue) + 5} L ${slotX(i) - 4} ${valueY(s.targetValue)} Z`}
                className="fill-muted-foreground"
              />
            ) : null
          )}

          {/* derived trend line (dashed, clearly not observed data) */}
          {trendLine && slots.length > 1 && (
            <line
              x1={slotX(0)} y1={valueY(trendLine.startValue)}
              x2={slotX(slots.length - 1)} y2={valueY(trendLine.endValue)}
              className="stroke-primary" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6"
            />
          )}

          {/* weekly points with enlarged invisible hit targets */}
          {slots.map((s, i) =>
            s.value !== null ? (
              <g key={s.label + i}>
                <circle
                  cx={slotX(i)} cy={valueY(s.value)}
                  r={s.hollow ? 3.5 : 4.5}
                  className={s.hollow ? 'stroke-primary fill-transparent' : 'fill-primary'}
                  strokeWidth={s.hollow ? 1.5 : 0}
                />
                <circle cx={slotX(i)} cy={valueY(s.value)} r={12} fill="transparent">
                  <title>{s.detail}</title>
                </circle>
              </g>
            ) : (
              <circle key={s.label + i} cx={slotX(i)} cy={VIEW_HEIGHT - PAD_BOTTOM} r={12}
                fill="transparent">
                <title>{s.detail}</title>
              </circle>
            )
          )}

          {/* x labels */}
          {slots.map((s, i) =>
            i % labelEvery === 0 || i === slots.length - 1 ? (
              <text key={`x${i}`} x={slotX(i)} y={VIEW_HEIGHT - 8} textAnchor="middle"
                fontSize={LABEL_FONT_SIZE} className="fill-muted-foreground">{s.label}</text>
            ) : null
          )}
        </svg>

        {legend && legend.length > 0 && (
          <p className="text-xs text-ink-muted">{legend.join(' · ')}</p>
        )}
        {footnote && <p className="text-xs text-ink-muted">{footnote}</p>}

        {/* Accessible text equivalents for every week. */}
        <ul className="sr-only">
          {slots.map((s, i) => (
            <li key={`sr${i}`}>{s.detail} ({unit})</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
