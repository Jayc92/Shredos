import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
} from '@/lib/supabase/server'
import { fetchWeeklyReviewSummary } from '@/lib/weekly-review'
import { CoachSubNav } from '@/components/coach/CoachSubNav'
import { Card, CardContent } from '@/components/ui/card'
import type { UnifiedWeeklyReview } from '@/lib/weekly-review'
import type { ExerciseProgressOverviewRow, OverviewStatus } from '@/lib/progress-overview'
import { progressColor } from '@/lib/workout'
import type { ProgressSignal } from '@/types/app'
import { formatDuration } from '@/lib/fasting'
import { cn } from '@/lib/utils'
import { localTodayFromCookies } from '@/lib/local-date-server'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/components/ui/page-header'
import {
  ArrowRight, ChevronLeft, ChevronRight, MoveRight, TrendingDown, TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TRACKING_MODES } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weekly review' }

// Same status meanings the Progress overview uses (Phase 2X) — text
// is ALWAYS present; UI-6C replaced the direction glyphs with
// aria-hidden Lucide icons.
const STATUS_META: Record<OverviewStatus, { label: string; Icon: LucideIcon | null }> = {
  improved: { label: 'Improving', Icon: TrendingUp },
  same: { label: 'Steady', Icon: MoveRight },
  declined: { label: 'Declining', Icon: TrendingDown },
  needs_data: { label: 'More data needed', Icon: null },
}

// UI-6C badge correction: lib/workout's progressColor returns legacy
// literal palette composites, but Tailwind scans only src/app,
// src/components, and src/pages — never src/lib — so those utilities
// are not in the compiled stylesheet and the chips rendered with
// transparent backgrounds/borders. This SCANNED consumer maps the
// helper's result to the semantic tokens the stylesheet actually
// ships, keyed on the hue word of the FIRST class token so no dead
// literal reappears anywhere in this file. The helper call and
// its signal meaning are untouched.
const SIGNAL_TOKEN: Record<string, string> = {
  green: 'bg-success-subtle text-success border-success/20',
  red: 'bg-critical-subtle text-critical border-critical/20',
  blue: 'bg-info-subtle text-info border-info/20',
  secondary: 'bg-surface-sunken text-ink-muted border-edge',
}
const signalBadgeClass = (signal: ProgressSignal): string =>
  SIGNAL_TOKEN[progressColor(signal).split(' ')[0].split('-')[1]] ?? 'bg-surface-sunken text-ink border-edge'

function StatusBadge({ status }: { status: OverviewStatus }) {
  const signalForColor: ProgressSignal = status === 'needs_data' ? 'new' : status
  const { label, Icon } = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        signalBadgeClass(signalForColor)
      )}
    >
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {label}
    </span>
  )
}

function NotableExerciseRow({ row }: { row: ExerciseProgressOverviewRow }) {
  const modeLabel = TRACKING_MODES.find((m) => m.value === row.trackingMode)?.label
  return (
    <div className="space-y-0.5 pb-3 border-b border-edge-subtle/60 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/progress/exercises/${row.exerciseId}`}
          className="text-sm font-semibold text-ink hover:underline"
        >
          {row.exerciseName}
        </Link>
        <StatusBadge status={row.status} />
      </div>
      {row.latestSummary && (
        <p className="text-xs text-ink-muted">
          {format(parseISO(row.latestWorkoutDate), 'MMM d')} — {row.latestSummary}
          {modeLabel ? ` · ${modeLabel}` : ''}
        </p>
      )}
      <p className="text-xs text-ink-muted">Latest comparison</p>
    </div>
  )
}

function trainingLine(training: UnifiedWeeklyReview['training']): string {
  const parts = [
    `${training.completedWorkouts} workout${training.completedWorkouts !== 1 ? 's' : ''}`,
    `${training.completedWorkingSets} working set${
      training.completedWorkingSets !== 1 ? 's' : ''
    }`,
  ]
  if (training.completedDurationSeconds !== null) {
    parts.push(formatDuration(Math.round(training.completedDurationSeconds / 60)))
  }
  return parts.join(' · ')
}

export default async function CheckInPage({
  searchParams,
}: {
  searchParams?: { week?: string | string[] }
}) {
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

  // Round-trip 2: 4-5 bounded queries inside fetchWeeklyReviewSummary
  // (Phase 3A — the completed-week review; the coach keeps its own
  // current-week fetchWeeklyReview data source, untouched).
  const review = await fetchWeeklyReviewSummary(
    supabase,
    user.id,
    localTodayFromCookies(),
    searchParams?.week,
    target,
    profile.fasting_enabled
  )

  const { range, navigation, confidence, weight, nutrition, training } = review
  const { exerciseProgress, activity, fasting, focusItems } = review

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      {/* 1. Review header — UI-6C: PageHeader primitive; same title
          and completed-week support copy. */}
      <PageHeader
        title="Weekly review"
        description="Evidence summary for a completed week — the current partial week is never shown as reviewed."
      />

      <CoachSubNav />

      {/* 2. Review period + evidence coverage */}
      <Card variant="elevated" className="gap-0 py-4">
        <CardContent className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Review period
            </h2>
            <p className="text-sm font-semibold text-ink">{range.label}</p>
            <nav aria-label="Review week navigation" className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`/check-in?week=${navigation.previousWeekStart}`}
                className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Previous week
              </Link>
              {navigation.nextWeekStart && (
                <Link
                  href={`/check-in?week=${navigation.nextWeekStart}`}
                  className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline"
                >
                  Next week
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
              {!navigation.isLatest && (
                <Link href="/check-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
                  Latest week
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
            </nav>
          </div>
          <div className="min-w-0 space-y-1 sm:text-right">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Evidence coverage
            </h2>
            <p className="text-sm font-medium text-ink">{confidence.label}</p>
            <p className="text-xs text-ink-muted">{confidence.detail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Whole-week empty banner (individual sections still render
          their own explicit states below). */}
      {!review.hasAnyData && (
        <Card variant="status" className="gap-0 py-6">
          <CardContent className="space-y-2 text-center">
          <p className="text-sm text-ink-muted">
            No data was logged for this review period.
          </p>
          <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
            <Link href="/food" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Log food
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
            <Link href="/weigh-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Log weigh-in
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
            <Link href="/workouts" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Log workout
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          </CardContent>
        </Card>
      )}

      {/* 3–5 + 7–8. Domain grid — Weight / Nutrition / Training /
          Activity, with Fasting (when enabled) spanning the full row
          so the conditional section never leaves a blank slot. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

      {/* 3. Body weight */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Weight</h2>
        {weight.loggedDays === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">No weigh-ins this week.</p>
            <Link href="/weigh-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Weigh-in
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {weight.latestWeightLbs !== null && (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums">
                  {weight.latestWeightLbs.toFixed(1)} lbs
                </span>
                <span className="text-sm text-ink-muted">Latest this week</span>
              </div>
            )}
            {weight.averageWeightLbs !== null && (
              <p className="text-xs text-ink-muted">
                Weekly average: {weight.averageWeightLbs.toFixed(1)} lbs
              </p>
            )}
            <p className="text-xs text-ink-muted">
              {weight.comparisonLabel ?? 'Not enough weigh-ins for a weekly comparison'}
            </p>
            <p className="text-xs text-ink-muted">
              {weight.loggedDays} weigh-in day{weight.loggedDays !== 1 ? 's' : ''}
            </p>
            <Link href="/weigh-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Weigh-in details
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 4. Nutrition */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Nutrition</h2>
        {nutrition.loggedDays === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">No nutrition logs this week.</p>
            <Link href="/food" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Log food
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-ink">
              {nutrition.loggedDays} of 7 days logged
            </p>
            {nutrition.averageCalories !== null && (
              <p className="text-xs text-ink-muted">
                {nutrition.averageCalories.toLocaleString()} average calories · Based on{' '}
                {nutrition.calorieDays} logged day{nutrition.calorieDays !== 1 ? 's' : ''}
              </p>
            )}
            {nutrition.averageProteinGrams !== null && (
              <p className="text-xs text-ink-muted">
                {nutrition.averageProteinGrams}g average protein
              </p>
            )}
            {nutrition.proteinTargetMetDays !== null &&
              nutrition.proteinTargetEligibleDays !== null && (
                <p className="text-xs text-ink-muted">
                  Protein target met on {nutrition.proteinTargetMetDays} of{' '}
                  {nutrition.proteinTargetEligibleDays} eligible day
                  {nutrition.proteinTargetEligibleDays !== 1 ? 's' : ''}
                </p>
              )}
            {nutrition.comparisonLabels.length > 0 ? (
              <div className="space-y-0.5">
                {nutrition.comparisonLabels.map((label, i) => (
                  <p key={i} className="text-xs text-ink-muted">
                    {label}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-muted">
                Not enough prior data for a weekly comparison.
              </p>
            )}
            <Link href="/nutrition" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Nutrition details
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 5. Training */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Training</h2>
        {training.completedWorkouts === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">No completed workouts this week.</p>
            {training.skippedWorkouts > 0 && (
              <p className="text-xs text-ink-muted">
                {training.skippedWorkouts} workout
                {training.skippedWorkouts !== 1 ? 's' : ''} skipped
              </p>
            )}
            <Link href="/workouts" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Workouts
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-ink">{trainingLine(training)}</p>
            {training.skippedWorkouts > 0 && (
              <p className="text-xs text-ink-muted">
                {training.skippedWorkouts} workout
                {training.skippedWorkouts !== 1 ? 's' : ''} skipped
              </p>
            )}
            <Link href="/workouts" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Workouts
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 7. Activity */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Activity</h2>
        {activity.loggedDays === 0 ? (
          <p className="text-sm text-ink-muted">No activity logged this week.</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-ink">
              {activity.loggedDays} of 7 days logged
            </p>
            {activity.averageSteps !== null && (
              <p className="text-xs text-ink-muted">
                {activity.averageSteps.toLocaleString()} average daily steps this week
              </p>
            )}
            {activity.totalSteps !== null && (
              <p className="text-xs text-ink-muted">
                {activity.totalSteps.toLocaleString()} total steps
              </p>
            )}
            <Link href="/activity" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Activity
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 8. Fasting (only when enabled — existing convention) */}
      {fasting !== null && (
        <Card variant="metric" className="gap-0 py-4 lg:col-span-2">
          <CardContent className="space-y-1.5">
          <h2 className="text-sm font-semibold text-ink">Fasting</h2>
          {fasting.completedFasts === 0 ? (
            <p className="text-sm text-ink-muted">No completed fasts this week.</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm text-ink">
                {fasting.completedFasts} completed fast
                {fasting.completedFasts !== 1 ? 's' : ''} ·{' '}
                {formatDuration(fasting.totalDurationMinutes)} total
              </p>
              {fasting.longestDurationMinutes !== null && (
                <p className="text-xs text-ink-muted">
                  Longest fast: {formatDuration(fasting.longestDurationMinutes)}
                </p>
              )}
              <Link href="/fasting" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
                Fasting
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          )}
          </CardContent>
        </Card>
      )}
      </div>

      {/* 6. Exercise progression */}
      <Card variant="default" className="gap-0 py-4">
        <CardContent className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Exercise progression</h2>
        {exerciseProgress.improving +
          exerciseProgress.steady +
          exerciseProgress.declining +
          exerciseProgress.needsData ===
        0 ? (
          <p className="text-sm text-ink-muted">
            No exercises had a qualifying session this week.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {exerciseProgress.improving}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">improving</p>
              </div>
              <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">{exerciseProgress.steady}</p>
                <p className="text-xs text-ink-muted mt-0.5">steady</p>
              </div>
              <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {exerciseProgress.declining}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">declining</p>
              </div>
              <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
                <p className="text-base font-bold tabular-nums">
                  {exerciseProgress.needsData}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">need more data</p>
              </div>
            </div>
            {exerciseProgress.notableExercises.length > 0 && (
              <div className="space-y-3">
                {exerciseProgress.notableExercises.map((row) => (
                  <NotableExerciseRow key={row.exerciseId} row={row} />
                ))}
              </div>
            )}
            <Link href="/progress" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Full progress
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </>
        )}
        </CardContent>
      </Card>

      {/* 9. Next-week focus — deterministic rules, max three items */}
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Next-week focus</h2>
        <ul className="space-y-1.5">
          {focusItems.map((item, i) => (
            <li key={i} className="text-sm text-ink flex items-start gap-2">
              <span className="text-brand">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        </CardContent>
      </Card>

      {/* Bottom links */}
      <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
        <Link href="/coach" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
          Coach
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
        <Link href="/progress" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
          Progress
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
