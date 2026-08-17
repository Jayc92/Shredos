import { ArrowRight, Scale, TrendingDown, TrendingUp, Minus, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { kgToLbs, calculateBMI } from '@/lib/units'
import { WeightTrendChart } from '@/components/dashboard/WeightTrendChart'
import { getTrendConfidence, confidenceLabel, computeWeightChange, getNextWeighInDate, getGoalAwareWeightChangeFraming } from '@/lib/weighIn'
import { localTodayFromCookies } from '@/lib/local-date-server'
import { formatDateShort } from '@/lib/dates'
import { getDayName } from '@/lib/dates'
import type { BodyMetric, UserProfile } from '@/types/database'

interface WeightCardProps {
  weighIns: BodyMetric[]
  profile: UserProfile
}

export function WeightCard({ weighIns, profile }: WeightCardProps) {
  const latest = weighIns[0] ?? null
  const previous = weighIns[1] ?? null
  const confidence = getTrendConfidence(profile.preferred_weigh_in_cadence, weighIns.length)
  const { label: confLabel, color: confColor, note: confNote } = confidenceLabel(confidence)

  const latestWeightLbs = latest?.weight_kg ? kgToLbs(latest.weight_kg) : null
  const goalWeightLbs = profile.goal_weight_kg ? kgToLbs(profile.goal_weight_kg) : null

  const change =
    latest?.weight_kg && previous?.weight_kg
      ? computeWeightChange(latest.weight_kg, previous.weight_kg)
      : null
  const changeColor = change
    ? getGoalAwareWeightChangeFraming(change.direction, profile.main_goal).color
    : null

  const lastDate = latest?.logged_date
    ? new Date(latest.logged_date + 'T00:00:00')
    : null

  // Local-date fix: with no prior weigh-in the lib would fall back
  // to new Date() — the UTC day on the server. Pass the user's local
  // day explicitly so the fallback never fires server-side.
  const nextDate = getNextWeighInDate(
    profile.preferred_weigh_in_cadence,
    lastDate ?? new Date(localTodayFromCookies() + 'T00:00:00'),
    profile.preferred_weigh_in_day
  )

  const bmi =
    latest?.weight_kg && profile.height_cm
      ? calculateBMI(latest.weight_kg, profile.height_cm)
      : null

  // UI-2 trend chart: chronological readings from the SAME fetched
  // weigh-ins (page already loads 20). Only actual recorded readings
  // — missing dates stay missing; the chart renders at >= 2 readings
  // and the single-reading state gets honest copy instead.
  const chartReadings = [...weighIns]
    .filter((w) => w.weight_kg !== null)
    .reverse()
    .map((w) => ({
      date: w.logged_date,
      lbs: kgToLbs(w.weight_kg as number),
      label: formatDateShort(w.logged_date + 'T00:00:00'),
    }))

  const ChangeIcon =
    change?.direction === 'down'
      ? TrendingDown
      : change?.direction === 'up'
      ? TrendingUp
      : Minus

  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-muted">Weight</span>
        </div>
        <span className={`text-xs font-medium ${confColor}`}>{confLabel}</span>
      </div>

      {/* Main metric */}
      {latestWeightLbs !== null ? (
        <div className="space-y-1">
          <div className="flex items-end gap-3">
            <span className="metric-value">{latestWeightLbs.toFixed(1)}</span>
            <span className="text-ink-muted text-sm mb-1">lbs</span>
            {change && (
              <div className={`flex items-center gap-1 mb-1 ${changeColor}`}>
                <ChangeIcon className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{change.label}</span>
              </div>
            )}
          </div>

          {latest?.logged_date && (
            <p className="text-xs text-ink-muted">
              Logged {formatDateShort(latest.logged_date + 'T00:00:00')}
            </p>
          )}

          {/* UI-2: recorded-readings trend chart (real date spacing;
              points are observations). One reading = honest copy, not
              a fabricated line. */}
          {chartReadings.length >= 2 ? (
            <div className="pt-2">
              <WeightTrendChart readings={chartReadings} />
            </div>
          ) : (
            <p className="text-xs text-ink-muted pt-1">
              One more weigh-in starts your trend line.
            </p>
          )}

          {/* Goal progress */}
          {goalWeightLbs !== null && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                {profile.current_weight_kg && profile.goal_weight_kg && (
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((kgToLbs(profile.current_weight_kg) - latestWeightLbs) /
                            (kgToLbs(profile.current_weight_kg) - goalWeightLbs)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-ink-muted whitespace-nowrap">
                Goal: {goalWeightLbs.toFixed(1)} lbs
              </span>
            </div>
          )}

          {/* BMI note */}
          {bmi && (
            <p className="text-xs text-ink-muted">
              BMI {bmi} — rough estimate only
            </p>
          )}
        </div>
      ) : (
        <div className="py-2">
          <p className="text-ink-muted text-sm">No weigh-in recorded yet.</p>
          <a
            href="/weigh-in"
            className="inline-flex min-h-11 mt-2 items-center gap-1 text-sm text-brand hover:underline"
          >
            Log your first weigh-in
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Next weigh-in */}
      <div className="pt-2 border-t border-edge-subtle">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
          {profile.preferred_weigh_in_cadence === 'manual' ? (
            <span className="text-xs text-ink-muted">Manual schedule — weigh in when ready.</span>
          ) : nextDate ? (
            <span className="text-xs text-ink-muted">
              Next weigh-in: {formatDateShort(nextDate)} (
              {getDayName(profile.preferred_weigh_in_day)},{' '}
              {profile.preferred_weigh_in_time})
            </span>
          ) : null}
        </div>
      </div>

      {/* Confidence note */}
      {confidence !== 'high' && (
        <p className="text-xs text-ink-muted bg-surface-sunken rounded-lg px-3 py-2">
          {confNote}
        </p>
      )}
      </CardContent>
    </Card>
  )
}
