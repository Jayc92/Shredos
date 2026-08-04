import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
  fetchRecentWeighIns,
} from '@/lib/supabase/server'
import { buildWeightTrendSummary, MIN_DATES_FOR_AVERAGE } from '@/lib/weight-trends'
import {
  buildNutritionTrendSummary,
  fetchNutritionTrendLogs,
  MIN_LOGGED_DAYS_FOR_AVERAGE,
} from '@/lib/nutrition-trends'
import { fetchStrengthRecords } from '@/lib/strength-records'
import {
  fetchTrackingAwareProgressOverview,
  filterOverviewRows,
  parseTrackingModeFilter,
} from '@/lib/progress-overview'
import type { ExerciseProgressOverviewRow, OverviewStatus } from '@/lib/progress-overview'
import { progressColor } from '@/lib/workout'
import type { ProgressSignal } from '@/types/app'
import { cn } from '@/lib/utils'
import { kgToLbs } from '@/lib/units'
import { format, parseISO } from 'date-fns'
import { TRACKING_MODES, PRIMARY_MUSCLES, EXERCISE_EQUIPMENT } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Progress' }

// Phase 2X: spec'd status labels — text always present, never
// color-alone (the badge colors reuse workout.ts's existing
// progressColor conventions).
const STATUS_LABELS: Record<OverviewStatus, string> = {
  improved: '↑ Improving',
  same: '→ Steady',
  declined: '↓ Declining',
  needs_data: 'More data needed',
}

/** Human-readable label lookup against the constants.ts option lists. */
function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  if (!value) return null
  return options.find((o) => o.value === value)?.label ?? null
}

function StatusBadge({ status }: { status: OverviewStatus }) {
  // needs_data borrows the existing 'new' badge treatment — both mean
  // "no baseline to compare against yet".
  const signalForColor: ProgressSignal = status === 'needs_data' ? 'new' : status
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        progressColor(signalForColor)
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  // Active state is conveyed by aria-current + weight + fill — never
  // color alone.
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-full border px-3 py-1 text-xs',
        active
          ? 'border-primary bg-primary/15 font-semibold text-foreground'
          : 'border-border bg-secondary font-medium text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </Link>
  )
}

function ExerciseOverviewCard({ row }: { row: ExerciseProgressOverviewRow }) {
  const metaParts = [
    optionLabel(PRIMARY_MUSCLES, row.primaryMuscle),
    optionLabel(EXERCISE_EQUIPMENT, row.equipment),
    optionLabel(TRACKING_MODES, row.trackingMode),
    row.isUnilateral ? 'Unilateral' : null,
  ].filter((part): part is string => part !== null)

  return (
    <div className="shred-card space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/progress/exercises/${row.exerciseId}`}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {row.exerciseName}
        </Link>
        <StatusBadge status={row.status} />
      </div>
      {metaParts.length > 0 && (
        <p className="text-xs text-muted-foreground">{metaParts.join(' · ')}</p>
      )}
      {row.latestSummary && (
        <p className="text-sm text-foreground">
          {format(parseISO(row.latestWorkoutDate), 'MMM d')} — {row.latestSummary}
        </p>
      )}
      {row.secondarySummary && (
        <p className="text-xs text-muted-foreground">{row.secondarySummary}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {row.recentSessionCount} recent session{row.recentSessionCount !== 1 ? 's' : ''}
      </p>
      <Link
        href={`/progress/exercises/${row.exerciseId}`}
        aria-label={`View ${row.exerciseName} progress`}
        className="text-xs text-primary hover:underline inline-block pt-0.5"
      >
        View progress →
      </Link>
    </div>
  )
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams?: { mode?: string | string[] }
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

  // Round-trip 2: independent reads run in parallel. Phase 2Z note:
  // fetchProgressSummary is no longer called here — its only remaining
  // consumer on this page was the old 28-day Nutrition card, which the
  // 7-day trend card below replaces (the Weight card moved off it in
  // Phase 2Y). The helper itself is unchanged and still serves
  // /weigh-in's 28-day summary via computeWeightProgress.
  const [strengthRecords, overviewRows, weighIns, nutritionTrendLogs] = await Promise.all([
    fetchStrengthRecords(supabase, user.id),
    fetchTrackingAwareProgressOverview(supabase, user.id),
    // Phase 2Y: same existing helper + 50-row bound /weigh-in uses.
    fetchRecentWeighIns(supabase, user.id, 50),
    // Phase 2Z: bounded trend fetch (latest logged date + the 28-day
    // window ending on it) — same helper /nutrition uses.
    fetchNutritionTrendLogs(supabase, user.id),
  ])

  // Phase 2Y: compact 7-day-average trend for the Weight section —
  // derived by the same pure helper /weigh-in uses, no chart here.
  const weightTrend = buildWeightTrendSummary(weighIns, profile.goal_weight_kg)

  // Phase 2Z: compact 7-day nutrition trend — adherence uses the
  // already-fetched authoritative target (nutrition_targets.protein_g).
  const nutritionTrend = buildNutritionTrendSummary(
    nutritionTrendLogs,
    target?.protein_g ?? null
  )

  // ?mode= filter: invalid or missing values fall back to All. The
  // summary tiles always reflect ALL tracked exercises; only the
  // Exercise progress list is filtered.
  const activeMode = parseTrackingModeFilter(searchParams?.mode)
  const filteredRows = filterOverviewRows(overviewRows, activeMode)

  const improvingCount = overviewRows.filter((r) => r.status === 'improved').length
  const needsDataCount = overviewRows.filter((r) => r.status === 'needs_data').length

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* 1. Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review exercise trends, personal records, body weight, and nutrition
          consistency.
        </p>
      </div>

      {/* 2. Progress summary — every value computed from the same
          overview/PR data shown below; nothing invented. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{overviewRows.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">exercises tracked</p>
        </div>
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{improvingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">improving</p>
        </div>
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{needsDataCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">need more data</p>
        </div>
        <div className="bg-secondary rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">
            {strengthRecords.recentPREvents.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">recent PRs</p>
        </div>
      </div>

      {/* 3. Exercise progress — unified tracking-aware overview,
          replacing the previous separate Strength Records and
          Cardio & Timed lists. */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Exercise progress</h2>

        {overviewRows.length === 0 ? (
          <div className="shred-card">
            <p className="text-sm text-muted-foreground">
              Complete a workout to begin tracking exercise progress.
            </p>
          </div>
        ) : (
          <>
            <nav aria-label="Filter exercises by tracking mode" className="flex flex-wrap gap-2">
              <FilterLink href="/progress" label="All" active={activeMode === null} />
              {TRACKING_MODES.map((m) => (
                <FilterLink
                  key={m.value}
                  href={`/progress?mode=${m.value}`}
                  label={m.label}
                  active={activeMode === m.value}
                />
              ))}
            </nav>

            {filteredRows.length === 0 ? (
              <div className="shred-card">
                <p className="text-sm text-muted-foreground">
                  No tracked exercises match this filter yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredRows.map((row) => (
                  <ExerciseOverviewCard key={row.exerciseId} row={row} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. Recent PRs (Phase 2D semantics preserved — strength-record
          based; no cardio/timed PR events exist or are invented). */}
      <div className="shred-card space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Recent PRs</h2>
        {strengthRecords.recentPREvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personal records yet.</p>
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

      {/* 5. Body progress — compact 7-day-average weight trend
          (Phase 2Y). Literal language only: direction is never
          colored or framed as good/bad. Full 28-day chart lives on
          /weigh-in, not here. */}
      <div className="shred-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Weight</h2>
        {!weightTrend.latest ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Log your first weigh-in to begin tracking body weight.
            </p>
            <Link href="/weigh-in" className="text-xs text-primary hover:underline">
              Log a weigh-in →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {weightTrend.latest.weightLbs.toFixed(1)} lbs
              </span>
              <span className="text-sm text-muted-foreground">
                Latest · {format(parseISO(weightTrend.latest.date), 'MMM d')}
              </span>
            </div>
            {weightTrend.currentAverageLbs !== null ? (
              <>
                <p className="text-xs text-muted-foreground">
                  7-day average: {weightTrend.currentAverageLbs.toFixed(1)} lbs · Based on{' '}
                  {weightTrend.currentAverageCount} weigh-in
                  {weightTrend.currentAverageCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {weightTrend.averageChangeLabel ??
                    'Not enough prior data for a seven-day comparison.'}
                </p>
              </>
            ) : weightTrend.distinctDateCount < MIN_DATES_FOR_AVERAGE ? (
              <p className="text-xs text-muted-foreground">
                Log at least two weigh-ins to see a weight trend.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Not enough recent weigh-ins for a seven-day average.
              </p>
            )}
            <Link href="/weigh-in" className="text-xs text-primary hover:underline">
              Weigh-in details →
            </Link>
          </div>
        )}
      </div>

      {/* 6. Nutrition consistency — compact 7-day trend (Phase 2Z).
          Literal language only; averages divide by logged days, never
          by 7, and missing days are never zero-calorie days. Charts
          live on /nutrition, not here. */}
      <div className="shred-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Nutrition</h2>
        {!nutritionTrend.latestLoggedDate ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Log food to begin tracking nutrition consistency.
            </p>
            <Link href="/food" className="text-xs text-primary hover:underline">
              Log food →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground">
              {nutritionTrend.currentLoggedDays} of 7 days logged
              {nutritionTrend.currentWindowLabel && (
                <span className="text-xs text-muted-foreground">
                  {' '}· {nutritionTrend.currentWindowLabel}
                </span>
              )}
            </p>
            {nutritionTrend.totalLoggedDays < MIN_LOGGED_DAYS_FOR_AVERAGE ? (
              <p className="text-xs text-muted-foreground">
                Log nutrition on at least two days to calculate a seven-day average.
              </p>
            ) : (
              <>
                {nutritionTrend.currentAverageCalories !== null && (
                  <p className="text-xs text-muted-foreground">
                    {nutritionTrend.currentAverageCalories.toLocaleString()} average calories
                    · Based on {nutritionTrend.currentCalorieDays} logged day
                    {nutritionTrend.currentCalorieDays !== 1 ? 's' : ''}
                  </p>
                )}
                {nutritionTrend.currentAverageProteinGrams !== null && (
                  <p className="text-xs text-muted-foreground">
                    {nutritionTrend.currentAverageProteinGrams}g average protein
                  </p>
                )}
                {nutritionTrend.proteinTargetMetDays !== null &&
                  nutritionTrend.proteinTargetEligibleDays !== null && (
                    <p className="text-xs text-muted-foreground">
                      Protein target met on {nutritionTrend.proteinTargetMetDays} of{' '}
                      {nutritionTrend.proteinTargetEligibleDays} logged day
                      {nutritionTrend.proteinTargetEligibleDays !== 1 ? 's' : ''}
                    </p>
                  )}
                {nutritionTrend.calorieComparisonLabel ? (
                  <p className="text-xs text-muted-foreground">
                    {nutritionTrend.calorieComparisonLabel}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Not enough prior data for a seven-day comparison.
                  </p>
                )}
              </>
            )}
            <Link href="/nutrition" className="text-xs text-primary hover:underline">
              Nutrition details →
            </Link>
          </div>
        )}
      </div>

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
