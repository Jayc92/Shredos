import { Scale, TrendingDown, TrendingUp, Minus, Calendar } from 'lucide-react'
import { kgToLbs, calculateBMI } from '@/lib/units'
import { getTrendConfidence, confidenceLabel, computeWeightChange, getNextWeighInDate } from '@/lib/weighIn'
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

  const lastDate = latest?.logged_date
    ? new Date(latest.logged_date + 'T00:00:00')
    : null

  const nextDate = getNextWeighInDate(
    profile.preferred_weigh_in_cadence,
    lastDate,
    profile.preferred_weigh_in_day
  )

  const bmi =
    latest?.weight_kg && profile.height_cm
      ? calculateBMI(latest.weight_kg, profile.height_cm)
      : null

  const ChangeIcon =
    change?.direction === 'down'
      ? TrendingDown
      : change?.direction === 'up'
      ? TrendingUp
      : Minus

  return (
    <div className="shred-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Weight</span>
        </div>
        <span className={`text-xs font-medium ${confColor}`}>{confLabel}</span>
      </div>

      {/* Main metric */}
      {latestWeightLbs !== null ? (
        <div className="space-y-1">
          <div className="flex items-end gap-3">
            <span className="metric-value">{latestWeightLbs.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm mb-1">lbs</span>
            {change && (
              <div className={`flex items-center gap-1 mb-1 ${change.color}`}>
                <ChangeIcon className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{change.label}</span>
              </div>
            )}
          </div>

          {latest?.logged_date && (
            <p className="text-xs text-muted-foreground">
              Logged {formatDateShort(latest.logged_date + 'T00:00:00')}
            </p>
          )}

          {/* Goal progress */}
          {goalWeightLbs !== null && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
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
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Goal: {goalWeightLbs.toFixed(1)} lbs
              </span>
            </div>
          )}

          {/* BMI note */}
          {bmi && (
            <p className="text-xs text-muted-foreground">
              BMI {bmi} — rough estimate only
            </p>
          )}
        </div>
      ) : (
        <div className="py-2">
          <p className="text-muted-foreground text-sm">No weigh-in recorded yet.</p>
          <a
            href="/weigh-in"
            className="inline-block mt-2 text-sm text-primary hover:underline"
          >
            Log your first weigh-in →
          </a>
        </div>
      )}

      {/* Next weigh-in */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          {profile.preferred_weigh_in_cadence === 'manual' ? (
            <span className="text-xs text-muted-foreground">Manual schedule — weigh in when ready.</span>
          ) : nextDate ? (
            <span className="text-xs text-muted-foreground">
              Next weigh-in: {formatDateShort(nextDate)} (
              {getDayName(profile.preferred_weigh_in_day)},{' '}
              {profile.preferred_weigh_in_time})
            </span>
          ) : null}
        </div>
      </div>

      {/* Confidence note */}
      {confidence !== 'high' && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          {confNote}
        </p>
      )}
    </div>
  )
}
