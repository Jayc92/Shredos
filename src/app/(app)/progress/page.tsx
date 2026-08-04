import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
  fetchCardioTimedRecords,
} from '@/lib/supabase/server'
import { fetchProgressSummary } from '@/lib/progress-summary'
import { fetchStrengthRecords } from '@/lib/strength-records'
import {
  formatDurationSeconds,
  formatDistanceMeters,
  formatPaceSecondsPerMile,
} from '@/lib/workout'
import { TRACKING_MODES } from '@/lib/constants'
import { kgToLbs } from '@/lib/units'
import { todayISO } from '@/lib/dates'
import { format, parseISO } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Progress' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Round-trip 1: profile + target in parallel (existing helpers)
  const [profile, target] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCurrentNutritionTarget(supabase, user.id),
  ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  // Round-trip 2: fetchProgressSummary (5 bounded 28-day queries),
  // fetchStrengthRecords (one all-time query), and
  // fetchCardioTimedRecords (Phase 2V, one all-time query) are all
  // independent of each other — run in parallel.
  const today = todayISO()
  const [summary, strengthRecords, cardioTimedRecords] = await Promise.all([
    fetchProgressSummary(
      supabase,
      user.id,
      today,
      target,
      profile.main_goal,
      profile.fasting_enabled,
      profile.step_goal
    ),
    fetchStrengthRecords(supabase, user.id),
    fetchCardioTimedRecords(supabase, user.id),
  ])

  const windowStartDate = parseISO(summary.windowStart)
  const windowEndDate = parseISO(summary.windowEnd)
  const sameMonth =
    format(windowStartDate, 'yyyy-MM') === format(windowEndDate, 'yyyy-MM')
  const sameYear =
    format(windowStartDate, 'yyyy') === format(windowEndDate, 'yyyy')
  const startLabel = format(windowStartDate, sameYear ? 'MMM d' : 'MMM d, yyyy')
  const endLabel = format(
    windowEndDate,
    sameMonth ? 'd' : sameYear ? 'MMM d' : 'MMM d, yyyy'
  )

  const { weight, nutrition, training, activity, fasting, wins } = summary

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {startLabel}–{endLabel} · Last {summary.daysCovered} days
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          A read-only look at the last 4 weeks — for day-to-day, see your
          weekly check-in or coach actions.
        </p>
      </div>

      {/* Strength Records (Phase 2D) — all-time, independent of the
          28-day summary below, so this has its own empty state rather
          than being gated on summary.hasAnyData. */}
      <div className="shred-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Strength Records</h2>
        {strengthRecords.records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No strength records yet.</p>
        ) : (
          <div className="space-y-4">
            {strengthRecords.records.map((r) => {
              const suffix = r.isUnilateral ? ' per side' : ''
              const trendLabel =
                r.trend === 'improving' ? 'Improving'
                : r.trend === 'stalling' ? 'Possible stall'
                : r.trend === 'steady'   ? 'Steady'
                : null // 'needs-data' — don't pretend a trend exists

              return (
                <div
                  key={r.exerciseId}
                  className="space-y-1 pb-4 border-b border-border/40 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-semibold text-foreground">{r.exerciseName}</p>
                  {r.maxWeightKg !== null && (
                    <p className="text-xs text-muted-foreground">
                      Weight PR: {Math.round(kgToLbs(r.maxWeightKg))} lbs{suffix}
                    </p>
                  )}
                  {r.maxEstimated1RmKg !== null && (
                    <p className="text-xs text-muted-foreground">
                      Est. 1RM: {Math.round(kgToLbs(r.maxEstimated1RmKg))} lbs{suffix}
                    </p>
                  )}
                  {r.maxBodyweightReps !== null && (
                    <p className="text-xs text-muted-foreground">
                      Rep PR: {r.maxBodyweightReps} reps
                    </p>
                  )}
                  {r.mostRecentBest && (
                    <p className="text-xs text-muted-foreground">
                      Recent best:{' '}
                      {r.mostRecentBest.weightKg !== null
                        ? `${Math.round(kgToLbs(r.mostRecentBest.weightKg))} lbs${
                            r.mostRecentBest.reps !== null ? ` × ${r.mostRecentBest.reps}` : ''
                          }${suffix}`
                        : r.mostRecentBest.reps !== null
                        ? `${r.mostRecentBest.reps} reps`
                        : '—'}
                    </p>
                  )}
                  {trendLabel && (
                    <p className="text-xs text-muted-foreground">Trend: {trendLabel}</p>
                  )}
                  <Link
                    href={`/progress/exercises/${r.exerciseId}`}
                    className="text-xs text-primary hover:underline inline-block pt-0.5"
                  >
                    View progress →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent PRs (Phase 2D) */}
      <div className="shred-card space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Recent PRs</h2>
        {strengthRecords.recentPREvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No PRs yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {strengthRecords.recentPREvents.map((e, i) => {
              const suffix = e.isUnilateral ? ' per side' : ''
              const dateLabel = format(parseISO(e.workoutDate), 'MMM d')
              const typeLabel =
                e.type === 'weight' ? 'Weight PR'
                : e.type === 'estimated_1rm' ? 'Est. 1RM PR'
                : 'Rep PR'
              const valueText =
                e.type === 'weight'
                  ? `${Math.round(kgToLbs(e.weightKg as number))} lbs${
                      e.reps !== null ? ` × ${e.reps}` : ''
                    }${suffix}`
                  : e.type === 'estimated_1rm'
                  ? `${Math.round(kgToLbs(e.estimated1RmKg as number))} lbs${suffix}`
                  : `${e.reps} reps${suffix}`

              return (
                <li key={i} className="text-xs text-foreground">
                  {dateLabel} — {e.exerciseName} — {typeLabel} — {valueText}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Cardio & Timed (Phase 2V) — all-time, same independence from
          the 28-day summary as Strength Records above. Duration/
          distance/pace only: weight and estimated-1RM framings never
          apply to these modes, so no such placeholder is ever shown. */}
      <div className="shred-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Cardio &amp; Timed</h2>
        {cardioTimedRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cardio or timed sessions yet.
          </p>
        ) : (
          <div className="space-y-4">
            {cardioTimedRecords.map((r) => {
              const modeLabel = TRACKING_MODES.find((m) => m.value === r.trackingMode)?.label
              const longestDuration = formatDurationSeconds(r.longestDurationSeconds)
              const bestDistance =
                r.trackingMode === 'cardio' ? formatDistanceMeters(r.bestDistanceMeters) : null
              const bestPace =
                r.trackingMode === 'cardio'
                  ? formatPaceSecondsPerMile(r.bestPaceDurationSeconds, r.bestPaceDistanceMeters)
                  : null

              return (
                <div
                  key={r.exerciseId}
                  className="space-y-1 pb-4 border-b border-border/40 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {r.exerciseName}
                    {modeLabel && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {' '}· {modeLabel}
                      </span>
                    )}
                  </p>
                  {bestDistance && (
                    <p className="text-xs text-muted-foreground">Best distance: {bestDistance}</p>
                  )}
                  {longestDuration && (
                    <p className="text-xs text-muted-foreground">
                      Longest duration: {longestDuration}
                    </p>
                  )}
                  {bestPace && (
                    <p className="text-xs text-muted-foreground">Best pace: {bestPace}</p>
                  )}
                  <Link
                    href={`/progress/exercises/${r.exerciseId}`}
                    className="text-xs text-primary hover:underline inline-block pt-0.5"
                  >
                    View progress →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!summary.hasAnyData && (
        <div className="shred-card text-center py-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            Nothing logged in the last 4 weeks yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Come back after a few weeks of logging to see your trends here.
          </p>
        </div>
      )}

      {/* Weight */}
      {summary.hasAnyData && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Weight</h2>
          {weight.weighInCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No weigh-ins logged in the last 4 weeks.
            </p>
          ) : weight.trend === 'insufficient-data' ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Only one weigh-in logged so far.
              </p>
              <Link href="/weigh-in" className="text-xs text-primary hover:underline">
                Log another weigh-in →
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p
                className={`text-2xl font-bold tabular-nums ${
                  weight.trend === 'down'
                    ? 'text-green-400'
                    : weight.trend === 'up'
                    ? 'text-red-400'
                    : 'text-foreground'
                }`}
              >
                {weight.deltaLbs !== null && weight.deltaLbs > 0 ? '+' : ''}
                {weight.deltaLbs} lb
              </p>
              <p className="text-xs text-muted-foreground">
                {weight.trend === 'down' && 'Trending down over the last 4 weeks'}
                {weight.trend === 'up' && 'Trending up over the last 4 weeks'}
                {weight.trend === 'stable' && 'Holding steady over the last 4 weeks'}
              </p>
              <p className="text-xs text-muted-foreground">
                {weight.weighInCount} weigh-in{weight.weighInCount !== 1 ? 's' : ''} logged
              </p>
            </div>
          )}
        </div>
      )}

      {/* Nutrition */}
      {summary.hasAnyData && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Nutrition</h2>
          {nutrition.loggedDays === 0 ? (
            <p className="text-sm text-muted-foreground">
              No food logged in the last 4 weeks.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                  <p className="text-base font-bold tabular-nums">
                    {nutrition.loggedDays}/28
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">days logged</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                  <p className="text-base font-bold tabular-nums">
                    {nutrition.avgCaloriesLogged !== null
                      ? nutrition.avgCaloriesLogged.toLocaleString()
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">avg cal</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                  <p className="text-base font-bold tabular-nums">
                    {nutrition.avgProteinLogged !== null
                      ? `${nutrition.avgProteinLogged}g`
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">avg protein</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {nutrition.confidence === 'consistent' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                    Consistent logging
                  </span>
                )}
                {nutrition.confidence === 'building' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                    Building consistency
                  </span>
                )}
                {nutrition.confidence === 'low' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                    Low logging so far
                  </span>
                )}
                {nutrition.proteinHitDays !== null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                    Protein hit {nutrition.proteinHitDays} days
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training */}
      {summary.hasAnyData && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Training</h2>
          {training.completedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workouts logged in the last 4 weeks.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums">
                  {training.completedCount}
                </span>
                <span className="text-sm text-muted-foreground">
                  workout{training.completedCount !== 1 ? 's' : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  · {training.avgPerWeek}/wk avg
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Best week: {training.bestWeekCount} workout
                {training.bestWeekCount !== 1 ? 's' : ''}
                {training.mostRecentDate &&
                  ` · Last workout ${format(parseISO(training.mostRecentDate), 'MMM d')}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {summary.hasAnyData && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Activity</h2>
          {activity.loggedDays === 0 ? (
            <p className="text-sm text-muted-foreground">
              No steps logged in the last 4 weeks.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {activity.loggedDays}/28
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">days logged</p>
              </div>
              <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {activity.avgSteps !== null ? activity.avgSteps.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">avg steps</p>
              </div>
              <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {activity.goalDays !== null ? activity.goalDays : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">goal days</p>
              </div>
            </div>
          )}
          {activity.bestDaySteps !== null && activity.bestDaySteps > 0 && (
            <p className="text-xs text-muted-foreground">
              Best day: {activity.bestDaySteps.toLocaleString()} steps
            </p>
          )}
        </div>
      )}

      {/* Fasting (only when profile.fasting_enabled) */}
      {fasting && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Fasting</h2>
          {fasting.completedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fasts completed in the last 4 weeks.
            </p>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {fasting.completedCount}
              </span>
              <span className="text-sm text-muted-foreground">
                fast{fasting.completedCount !== 1 ? 's' : ''}
              </span>
              <span className="text-sm text-muted-foreground">
                · {fasting.totalHours}h total
              </span>
              {fasting.longestHours !== null && (
                <span className="text-sm text-muted-foreground">
                  · {fasting.longestHours}h longest
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wins (only when non-empty) */}
      {wins.length > 0 && (
        <div className="shred-card space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Wins</h2>
          <ul className="space-y-1.5">
            {wins.map((win, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom links */}
      <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
        <Link href="/check-in" className="text-xs text-primary hover:underline">
          Weekly check-in →
        </Link>
        <Link href="/coach" className="text-xs text-primary hover:underline">
          Coach actions →
        </Link>
        <Link href="/decisions" className="text-xs text-primary hover:underline">
          Decisions →
        </Link>
      </div>
    </div>
  )
}
