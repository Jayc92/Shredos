import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
} from '@/lib/supabase/server'
import { fetchWeeklyReview } from '@/lib/weekly-review'
import { kgToLbs } from '@/lib/units'
import { todayISO } from '@/lib/dates'
import { format, parseISO } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weekly check-in' }

export default async function CheckInPage() {
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

  // Round-trip 2: 3-4 bounded queries inside fetchWeeklyReview
  const today  = todayISO()
  const review = await fetchWeeklyReview(
    supabase,
    user.id,
    today,
    target,
    profile.main_goal,
    profile.fasting_enabled
  )

  const weekStartDate = parseISO(review.weekStart)
  const weekEndDate   = parseISO(review.weekEnd)
  const startLabel    = format(weekStartDate, 'MMM d')
  const endLabel      = format(weekEndDate, 'd')

  const weightLbs =
    review.latestWeightKg !== null
      ? Math.round(kgToLbs(review.latestWeightKg) * 10) / 10
      : null

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Weekly check-in</h1>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground">
            {startLabel}–{endLabel} · Day {review.daysElapsed} of 7
          </p>
          {review.daysRemaining > 0 && (
            <span className="text-xs text-muted-foreground">
              ({review.daysRemaining} day{review.daysRemaining !== 1 ? 's' : ''} remaining)
            </span>
          )}
        </div>
        {review.daysElapsed < 3 && (
          <p className="text-xs text-muted-foreground mt-1">
            Week is just getting started — check back after a few more days.
          </p>
        )}
      </div>

      {/* Empty state */}
      {!review.hasAnyData && (
        <div className="shred-card text-center py-8 space-y-2">
          <p className="text-sm text-muted-foreground">Nothing logged yet this week.</p>
          <p className="text-xs text-muted-foreground">
            Your check-in will fill in as you log food, workouts, and weigh-ins.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/food" className="text-xs text-primary hover:underline">
              Log food →
            </Link>
            <Link href="/weigh-in" className="text-xs text-primary hover:underline">
              Log weigh-in →
            </Link>
            <Link href="/workouts" className="text-xs text-primary hover:underline">
              Log workout →
            </Link>
          </div>
        </div>
      )}

      {/* Weight */}
      {review.hasAnyData && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Weight</h2>
          {review.weighInsThisWeek === 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">No weigh-in logged this week.</p>
              <Link href="/weigh-in" className="text-xs text-primary hover:underline">
                Log weigh-in →
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {weightLbs !== null && (
                <p className="text-2xl font-bold tabular-nums">{weightLbs} lb</p>
              )}
              {review.weeklyChangeLbs !== null ? (
                <p
                  className={`text-sm font-medium ${
                    review.weeklyChangeLbs < 0
                      ? 'text-green-400'
                      : review.weeklyChangeLbs > 0
                      ? 'text-red-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {review.weeklyChangeLbs > 0 ? '+' : ''}
                  {review.weeklyChangeLbs} lb vs prior weigh-in
                </p>
              ) : review.latestWeightKg !== null ? (
                <p className="text-xs text-muted-foreground">
                  Log another weigh-in to see your weekly change.
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {review.weighInsThisWeek} weigh-in
                {review.weighInsThisWeek !== 1 ? 's' : ''} this week
              </p>
            </div>
          )}
        </div>
      )}

      {/* Nutrition */}
      <div className="shred-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Nutrition</h2>
        {review.foodLoggedDays === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">No food logged this week.</p>
            <Link href="/food" className="text-xs text-primary hover:underline">
              Log food →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {review.foodLoggedDays}/7
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">days logged</p>
              </div>
              <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {review.avgCaloriesLogged !== null
                    ? review.avgCaloriesLogged.toLocaleString()
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">avg cal</p>
              </div>
              <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {review.avgProteinLogged !== null
                    ? `${review.avgProteinLogged}g`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">avg protein</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {review.calorieTrend === 'on-track' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                  Calories on track
                </span>
              )}
              {review.calorieTrend === 'above' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                  Calories above target
                </span>
              )}
              {review.calorieTrend === 'below' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                  Calories below target
                </span>
              )}
              {review.proteinStatus === 'meeting' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                  Protein on target
                </span>
              )}
              {review.proteinStatus === 'close' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                  Protein slightly under
                </span>
              )}
              {review.proteinStatus === 'low' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
                  Protein low
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Training */}
      <div className="shred-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Training</h2>
        {review.sessionsCompleted === 0 && !review.hasActiveSession ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">No workouts logged this week.</p>
            <Link href="/workouts" className="text-xs text-primary hover:underline">
              Start a workout →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {review.sessionsCompleted}
              </span>
              <span className="text-sm text-muted-foreground">
                session{review.sessionsCompleted !== 1 ? 's' : ''}
              </span>
              {review.totalSetsCompleted > 0 && (
                <span className="text-sm text-muted-foreground">
                  · {review.totalSetsCompleted} sets
                </span>
              )}
            </div>
            {review.sessionDates.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {review.sessionDates.map((date, i) => (
                  <span
                    key={i}
                    className="text-xs bg-secondary rounded-md px-2 py-0.5 text-muted-foreground"
                  >
                    {format(parseISO(date), 'EEE')}
                  </span>
                ))}
              </div>
            )}
            {review.hasActiveSession && (
              <p className="text-xs text-amber-400">Workout currently in progress.</p>
            )}
          </div>
        )}
      </div>

      {/* Fasting (only when profile.fasting_enabled) */}
      {review.fastingEnabled && (
        <div className="shred-card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Fasting</h2>
          {review.fastsCompletedThisWeek === 0 ? (
            <p className="text-sm text-muted-foreground">No fasts completed this week.</p>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {review.fastsCompletedThisWeek}
              </span>
              <span className="text-sm text-muted-foreground">
                fast{review.fastsCompletedThisWeek !== 1 ? 's' : ''}
              </span>
              {review.avgFastHours !== null && (
                <span className="text-sm text-muted-foreground">
                  · {review.avgFastHours}h avg
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Primary focus */}
      {review.primaryFocus && (
        <div className="shred-card space-y-1.5">
          <p className="text-xs text-muted-foreground">This week’s focus</p>
          <p className="text-sm text-foreground leading-relaxed">
            {review.primaryFocus}
          </p>
        </div>
      )}
    </div>
  )
}
