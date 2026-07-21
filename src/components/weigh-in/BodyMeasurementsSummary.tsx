// ============================================================
// ShredOS — Body Measurements Summary (Phase 1M)
// Read-only, neutral, factual waist summary. No goal-aware color,
// no coaching language, no medical claims — unlike weight framing,
// there's no established safe "which direction is good" rule for
// waist, so this stays purely descriptive.
// ============================================================

interface BodyMeasurementsSummaryProps {
  latestWaistIn: number | null
  deltaFromPreviousIn: number | null
  delta28DayIn: number | null
  totalWaistCount: number
  waistCountLast28Days: number
}

export function BodyMeasurementsSummary({
  latestWaistIn,
  deltaFromPreviousIn,
  delta28DayIn,
  totalWaistCount,
  waistCountLast28Days,
}: BodyMeasurementsSummaryProps) {
  if (totalWaistCount === 0) return null

  return (
    <div className="shred-card space-y-2">
      <h3 className="text-sm font-medium text-foreground">Body measurements</h3>

      {latestWaistIn !== null && (
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums">{latestWaistIn.toFixed(1)}"</span>
          <span className="text-sm text-muted-foreground">Latest waist</span>
        </div>
      )}

      {totalWaistCount === 1 ? (
        <p className="text-xs text-muted-foreground">
          Log another waist measurement to see a trend.
        </p>
      ) : (
        <>
          {deltaFromPreviousIn !== null && (
            <p className="text-xs text-muted-foreground">
              {deltaFromPreviousIn > 0 ? '+' : ''}
              {deltaFromPreviousIn.toFixed(1)}" vs. last logged
            </p>
          )}

          {waistCountLast28Days >= 2 && delta28DayIn !== null ? (
            <p className="text-xs text-muted-foreground">
              {delta28DayIn > 0 ? '+' : ''}
              {delta28DayIn.toFixed(1)}" over the last 28 days
            </p>
          ) : waistCountLast28Days === 0 ? (
            <p className="text-xs text-muted-foreground">
              No waist measurement logged in the last 28 days.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
