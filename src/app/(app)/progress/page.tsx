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
import { ProgressSubNav } from '@/components/progress/ProgressSubNav'
import { ProgressWeightChart } from '@/components/progress/ProgressWeightChart'
import { TrainingCoverageSection } from '@/components/progress/TrainingCoverageSection'
import { EnergyTrendSection } from '@/components/progress/EnergyTrendSection'
import { fetchProgressEnergyTrends, parseEnergyRange } from '@/lib/progress-energy'
import { localTodayFromCookies } from '@/lib/local-date-server'
import { addDaysISO } from '@/lib/local-date'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Check, MoveRight, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProgressSignal } from '@/types/app'
import { cn } from '@/lib/utils'
import { kgToLbs } from '@/lib/units'
import { format, parseISO, subDays } from 'date-fns'
import { TRACKING_MODES, PRIMARY_MUSCLES, EXERCISE_EQUIPMENT } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Progress' }

// Phase 2X: spec'd status labels — text always present, never
// color-alone (the badge colors reuse workout.ts's existing
// progressColor conventions). UI-7: the direction glyphs became
// aria-hidden Lucide icons beside the SAME text — matching the
// Weekly Review StatusBadge exactly.
const STATUS_META: Record<OverviewStatus, { label: string; Icon: LucideIcon | null }> = {
  improved: { label: 'Improving', Icon: TrendingUp },
  same: { label: 'Steady', Icon: MoveRight },
  declined: { label: 'Declining', Icon: TrendingDown },
  needs_data: { label: 'More data needed', Icon: null },
}

/** Human-readable label lookup against the constants.ts option lists. */
function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  if (!value) return null
  return options.find((o) => o.value === value)?.label ?? null
}

// UI-6C badge correction: lib/workout's progressColor returns legacy
// literal palette composites, but Tailwind scans only src/app,
// src/components, and src/pages — never src/lib — so those utilities
// are not in the compiled stylesheet and the chips rendered with
// transparent backgrounds/borders. This SCANNED consumer maps the
// helper's result to the semantic tokens the stylesheet ships, keyed
// on the hue word of the FIRST class token so no dead literal
// reappears anywhere in this file. Helper call and signal meaning
// untouched.
const SIGNAL_TOKEN: Record<string, string> = {
  green: 'bg-success-subtle text-success border-success/20',
  red: 'bg-critical-subtle text-critical border-critical/20',
  blue: 'bg-info-subtle text-info border-info/20',
  secondary: 'bg-surface-sunken text-ink-muted border-edge',
}
const signalBadgeClass = (signal: ProgressSignal): string =>
  SIGNAL_TOKEN[progressColor(signal).split(' ')[0].split('-')[1]] ?? 'bg-surface-sunken text-ink border-edge'

function StatusBadge({ status }: { status: OverviewStatus }) {
  // needs_data borrows the existing 'new' badge treatment — both mean
  // "no baseline to compare against yet".
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

function FilterLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  // Same visual language as the FilterChip primitive (check glyph +
  // border + weight — never color alone), but rendered as real links
  // because these filters are querystring navigation, not client state.
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-brand bg-surface-selected font-semibold text-ink'
          : 'border-edge-subtle bg-surface font-medium text-ink-muted hover:text-ink'
      )}
    >
      {active && <Check className="size-3" aria-hidden="true" />}
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
    <Card variant="interactive" className="gap-0 py-4">
      <CardContent className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/progress/exercises/${row.exerciseId}`}
          className="text-sm font-semibold text-ink hover:underline"
        >
          {row.exerciseName}
        </Link>
        <StatusBadge status={row.status} />
      </div>
      {metaParts.length > 0 && (
        <p className="text-xs text-ink-muted">{metaParts.join(' · ')}</p>
      )}
      {row.latestSummary && (
        <p className="text-sm text-ink">
          {format(parseISO(row.latestWorkoutDate), 'MMM d')} — {row.latestSummary}
        </p>
      )}
      {row.secondarySummary && (
        <p className="text-xs text-ink-muted">{row.secondarySummary}</p>
      )}
      <p className="text-xs text-ink-muted">
        {row.recentSessionCount} recent session{row.recentSessionCount !== 1 ? 's' : ''}
      </p>
      <Link
        href={`/progress/exercises/${row.exerciseId}`}
        aria-label={`View ${row.exerciseName} progress`}
        className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline pt-0.5"
      >
        View progress
        <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </Link>
      </CardContent>
    </Card>
  )
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams?: { mode?: string | string[]; range?: string | string[] }
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
  // Phase 5B.5: ?range= selects the Energy & adherence window
  // (4/8/12 completed weeks, default 8) — evidence semantics never
  // change with the range.
  const energyRange = parseEnergyRange(searchParams?.range)
  // Local-date fix: the energy window anchors to the user's calendar
  // day (timezone cookie), not the server's UTC day.
  const localToday = localTodayFromCookies()

  const [strengthRecords, overviewRows, weighIns, nutritionTrendLogs, energyTrends] = await Promise.all([
    fetchStrengthRecords(supabase, user.id),
    fetchTrackingAwareProgressOverview(supabase, user.id),
    // Phase 2Y: same existing helper + 50-row bound /weigh-in uses.
    fetchRecentWeighIns(supabase, user.id, 50),
    // Phase 2Z: bounded trend fetch (latest logged date + the 28-day
    // window ending on it) — same helper /nutrition uses.
    fetchNutritionTrendLogs(supabase, user.id),
    // Phase 5B.5: read-only aggregation over the stable 5B evidence.
    fetchProgressEnergyTrends(supabase, user.id, localToday, energyRange, target, profile),
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

  // UI-4 feature chart: the SAME already-fetched weigh-ins (bounded
  // 50-row read), windowed to the selected ?range weeks. A visual
  // window only — no evidence semantics change, no new read, no
  // synthesized observations; chronological real dates and values.
  const chartWindowStart = addDaysISO(localToday, -(energyRange * 7))
  const chartReadings = [...weighIns]
    .filter((w) => w.weight_kg !== null && w.logged_date >= chartWindowStart)
    .reverse()
    .map((w) => ({
      date: w.logged_date,
      lbs: kgToLbs(w.weight_kg as number),
      label: format(parseISO(w.logged_date), 'MMM d'),
    }))
  const goalLbs = profile.goal_weight_kg !== null ? kgToLbs(profile.goal_weight_kg) : null

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6 xl:space-y-6">
      {/* 1. Page header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Progress</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Review exercise trends, personal records, body weight, and nutrition
          consistency.
        </p>
      </div>

      <ProgressSubNav fastingEnabled={profile.fasting_enabled} />

      {/* 2. Progress summary — every value computed from the same
          overview/PR data shown below; nothing invented. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{overviewRows.length}</p>
          <p className="text-xs text-ink-muted mt-0.5">exercises tracked</p>
        </div>
        <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{improvingCount}</p>
          <p className="text-xs text-ink-muted mt-0.5">improving</p>
        </div>
        <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">{needsDataCount}</p>
          <p className="text-xs text-ink-muted mt-0.5">need more data</p>
        </div>
        <div className="bg-surface-sunken rounded-lg px-2 py-2.5 text-center">
          <p className="text-base font-bold tabular-nums">
            {strengthRecords.recentPREvents.length}
          </p>
          <p className="text-xs text-ink-muted mt-0.5">recent PRs</p>
        </div>
      </div>

      {/* 3. Exercise progress — unified tracking-aware overview,
          replacing the previous separate Strength Records and
          Cardio & Timed lists. */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Exercise progress</h2>

        {overviewRows.length === 0 ? (
          <Card variant="status" className="gap-0 py-4">
            <CardContent>
            <p className="text-sm text-ink-muted">
              Complete a workout to begin tracking exercise progress.
            </p>
            </CardContent>
          </Card>
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
              <Card variant="status" className="gap-0 py-4">
                <CardContent>
                <p className="text-sm text-ink-muted">
                  No tracked exercises match this filter yet.
                </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRows.map((row) => (
                  <ExerciseOverviewCard key={row.exerciseId} row={row} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* UI-4: Training coverage — recorded overview rows grouped by
          primary muscle (no new reads; attribution boundary documented
          in the component). */}
      <TrainingCoverageSection rows={overviewRows} />

      {/* 4. Recent PRs (Phase 2D semantics preserved — strength-record
          based; no cardio/timed PR events exist or are invented). */}
      <Card variant="default" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Recent PRs</h2>
        {strengthRecords.recentPREvents.length === 0 ? (
          <p className="text-sm text-ink-muted">No personal records yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <li key={i}
                  className="rounded-lg bg-surface-sunken px-3 py-2.5">
                  <p className="text-xs font-medium text-ink-muted">
                    {typeLabel} · {dateLabel}
                  </p>
                  <p className="min-w-0 break-words text-sm font-semibold text-ink">
                    {e.exerciseName}
                  </p>
                  <p className="text-sm tabular-nums text-ink">{valueText}</p>
                </li>
              )
            })}
          </ul>
        )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-5 items-start">
      {/* 5. Body progress — compact 7-day-average weight trend
          (Phase 2Y). Literal language only: direction is never
          colored or framed as good/bad. Full 28-day chart lives on
          /weigh-in, not here. */}
      <Card variant="metric" className="gap-0 py-4 lg:col-span-8">
        <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="text-sm font-semibold text-ink">Weight</h2>
          <span className="text-xs text-ink-muted">Last {energyRange} weeks</span>
        </div>
        {!weightTrend.latest ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">
              Log your first weigh-in to begin tracking body weight.
            </p>
            <Link href="/weigh-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Log a weigh-in
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {weightTrend.latest.weightLbs.toFixed(1)} lbs
              </span>
              <span className="text-sm text-ink-muted">
                Latest · {format(parseISO(weightTrend.latest.date), 'MMM d')}
              </span>
            </div>
            {weightTrend.currentAverageLbs !== null ? (
              <>
                <p className="text-xs text-ink-muted">
                  7-day average: {weightTrend.currentAverageLbs.toFixed(1)} lbs · Based on{' '}
                  {weightTrend.currentAverageCount} weigh-in
                  {weightTrend.currentAverageCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-ink-muted">
                  {weightTrend.averageChangeLabel ??
                    'Not enough prior data for a seven-day comparison.'}
                </p>
              </>
            ) : weightTrend.distinctDateCount < MIN_DATES_FOR_AVERAGE ? (
              <p className="text-xs text-ink-muted">
                Log at least two weigh-ins to see a weight trend.
              </p>
            ) : (
              <p className="text-xs text-ink-muted">
                Not enough recent weigh-ins for a seven-day average.
              </p>
            )}
            {/* UI-4 feature chart: >= 2 windowed real observations;
                sparse states stay honest (one dot is never a trend). */}
            {chartReadings.length >= 2 ? (
              <div className="pt-2">
                <ProgressWeightChart readings={chartReadings} goalLbs={goalLbs} />
              </div>
            ) : chartReadings.length === 1 ? (
              <p className="text-xs text-ink-muted pt-1">
                One weigh-in recorded in this range — one more starts the trend chart.
              </p>
            ) : (
              <p className="text-xs text-ink-muted pt-1">
                No weigh-ins recorded in the selected range.
              </p>
            )}
            <Link href="/weigh-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Weigh-in details
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 6. Nutrition consistency — compact 7-day trend (Phase 2Z).
          Literal language only; averages divide by logged days, never
          by 7, and missing days are never zero-calorie days. Charts
          live on /nutrition, not here. */}
      <Card variant="metric" className="gap-0 py-4 lg:col-span-4">
        <CardContent className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Nutrition</h2>
        {!nutritionTrend.latestLoggedDate ? (
          <div className="space-y-1">
            <p className="text-sm text-ink-muted">
              Log food to begin tracking nutrition consistency.
            </p>
            <Link href="/food" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Log food
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-ink">
              {nutritionTrend.currentLoggedDays} of 7 days logged
              {nutritionTrend.currentWindowLabel && (
                <span className="text-xs text-ink-muted">
                  {' '}· {nutritionTrend.currentWindowLabel}
                </span>
              )}
            </p>
            {nutritionTrend.totalLoggedDays < MIN_LOGGED_DAYS_FOR_AVERAGE ? (
              <p className="text-xs text-ink-muted">
                Log nutrition on at least two days to calculate a seven-day average.
              </p>
            ) : (
              <>
                {nutritionTrend.currentAverageCalories !== null && (
                  <p className="text-xs text-ink-muted">
                    {nutritionTrend.currentAverageCalories.toLocaleString()} average calories
                    · Based on {nutritionTrend.currentCalorieDays} logged day
                    {nutritionTrend.currentCalorieDays !== 1 ? 's' : ''}
                  </p>
                )}
                {nutritionTrend.currentAverageProteinGrams !== null && (
                  <p className="text-xs text-ink-muted">
                    {nutritionTrend.currentAverageProteinGrams}g average protein
                  </p>
                )}
                {nutritionTrend.proteinTargetMetDays !== null &&
                  nutritionTrend.proteinTargetEligibleDays !== null && (
                    <p className="text-xs text-ink-muted">
                      Protein target met on {nutritionTrend.proteinTargetMetDays} of{' '}
                      {nutritionTrend.proteinTargetEligibleDays} logged day
                      {nutritionTrend.proteinTargetEligibleDays !== 1 ? 's' : ''}
                    </p>
                  )}
                {nutritionTrend.calorieComparisonLabel ? (
                  <p className="text-xs text-ink-muted">
                    {nutritionTrend.calorieComparisonLabel}
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted">
                    Not enough prior data for a seven-day comparison.
                  </p>
                )}
              </>
            )}
            <Link href="/nutrition" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Nutrition details
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        </CardContent>
      </Card>
      </div>

      {/* Phase 5B.5: Energy & adherence trends — read-only
          visualization of the stable 5B evidence (weekly intake vs
          historical targets, weekly weight anchors, coverage,
          user-relative activity, maintenance summary). */}
      <EnergyTrendSection
        model={energyTrends}
        modeParam={Array.isArray(searchParams?.mode) ? searchParams?.mode[0] : searchParams?.mode ?? null}
      />

      {/* Bottom links */}
      <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
        <Link href="/check-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
          Weekly review
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
        <Link href="/coach" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
          Coach
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
        <Link href="/decisions" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
          Decisions
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
