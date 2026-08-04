import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchCurrentNutritionTarget,
} from '@/lib/supabase/server'
import { fetchProgressSummary } from '@/lib/progress-summary'
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
import { todayISO } from '@/lib/dates'
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

  // Round-trip 2: fetchProgressSummary (5 bounded 28-day queries),
  // fetchStrengthRecords (one all-time query, still the Recent PRs
  // source), and fetchTrackingAwareProgressOverview (Phase 2X, one
  // all-time query + pure reducer) are independent — run in parallel.
  const today = todayISO()
  const [summary, strengthRecords, overviewRows] = await Promise.all([
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
    fetchTrackingAwareProgressOverview(supabase, user.id),
  ])

  const { weight, nutrition } = summary

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

      {/* 5. Body progress — the existing Weight section, semantics
          unchanged (28-day window, same trend states, same weigh-in
          link). */}
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

      {/* 6. Nutrition consistency — the existing Nutrition section,
          calculations and semantics unchanged. */}
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
