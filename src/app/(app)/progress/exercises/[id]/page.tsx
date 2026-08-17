import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchExerciseHistory,
  fetchCardioTimedProgressDetail,
} from '@/lib/supabase/server'
import { fetchExerciseProgressDetail } from '@/lib/strength-records'
import type { ExerciseProgressDetail, PREvent } from '@/lib/strength-records'
import {
  formatPreviousBest,
  suggestNextTarget,
  formatTrackingAwareSetSummary,
  formatDurationSeconds,
  formatDistanceMeters,
  formatPaceSecondsPerMile,
  trackingAwareProgressSignal,
  progressLabel,
} from '@/lib/workout'
import type { ExerciseHistoryEntry } from '@/lib/workout'
import {
  buildWeightRepsTrend,
  buildBodyweightTrends,
  buildCardioTrends,
  buildTimedTrend,
} from '@/lib/progress-charts'
import { ArrowLeft } from 'lucide-react'
import ExerciseTrendChart from '@/components/progress/ExerciseTrendChart'

// UI-7: progressLabel's returned strings carry direction glyphs; this
// page maps each signal to the SAME wording without the glyph. The
// lib helper stays byte-untouched and remains the fallback for any
// future signal this map does not know.
const SIGNAL_TEXT: Record<string, string> = {
  improved: 'Improved',
  declined: 'Declined',
  same: 'Same',
  new: 'New exercise',
}
import { ProgressSubNav } from '@/components/progress/ProgressSubNav'
import { Card, CardContent } from '@/components/ui/card'
import { kgToLbs } from '@/lib/units'
import { TRACKING_MODES, PRIMARY_MUSCLES, EXERCISE_EQUIPMENT } from '@/lib/constants'
import type { WorkoutSet, TrackingMode, ExerciseEquipment, PrimaryMuscle } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exercise progress' }

const PR_HISTORY_INITIAL_CAP = 10
// Phase 2V: recent history is 5 sessions for every tracking mode (the
// shared detail-page requirement) — previously 10, weight_reps only.
const RECENT_HISTORY_LIMIT = 5
// Phase 2W: trend charts read up to 15 sessions — fetchExerciseHistory's
// own scan window, so this asks for everything one call can return.
// The Phase 2V header count, history lists, and entries[0]/entries[1]
// signal all keep working from a slice(0, RECENT_HISTORY_LIMIT) of the
// same result, so their behavior is unchanged.
const CHART_HISTORY_LIMIT = 15

/** Human-readable label lookup against the constants.ts option lists. */
function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  if (!value) return null
  return options.find((o) => o.value === value)?.label ?? null
}

/**
 * Minimal synthetic WorkoutSet adapter (Phase 2V): lets the page feed
 * ExerciseHistoryEntry pairs into workout.ts's
 * trackingAwareProgressSignal instead of reproducing the cardio/timed
 * comparison rules here. Same synthetic-set convention
 * fetchPreviousBests and this page's own coaching input already use.
 */
function toSyntheticWorkoutSet(entry: ExerciseHistoryEntry, exerciseId: string): WorkoutSet {
  return {
    id: '',
    workout_exercise_id: exerciseId,
    set_number: 0,
    weight_kg: entry.weightKg,
    reps: entry.reps,
    rpe: entry.rpe,
    completed: true,
    is_warmup: false,
    notes: null,
    duration_seconds: entry.durationSeconds,
    distance_meters: entry.distanceMeters,
    created_at: entry.workoutDate,
  }
}

export default async function ExerciseProgressDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  if (!profile) redirect('/onboarding')

  // Page-local, RLS-respecting metadata query (Phase 2V): the shared
  // header needs primary_muscle, which the strength detail return type
  // deliberately doesn't include — strength-records.ts stays unchanged
  // and strength-only, so the page fetches its own display metadata.
  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, name, primary_muscle, equipment, tracking_mode, unilateral')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!exercise) notFound()

  const trackingMode = exercise.tracking_mode as TrackingMode
  const isCardioTimed = trackingMode === 'cardio' || trackingMode === 'timed'
  const isUnilateral = !!exercise.unilateral

  // Recent history (all four modes) + the mode-appropriate all-time
  // aggregate, in parallel. fetchExerciseHistory is the SOLE source
  // for latest timed RPE, the most recent session summary, recent
  // history, and the comparable-session signal — all-time cards come
  // from the dedicated aggregate scans instead, because "one
  // representative set per session" can miss the true all-time best.
  const [historyMap, strengthDetail, cardioTimedDetail] = await Promise.all([
    fetchExerciseHistory(supabase, user.id, [exercise.id], undefined, CHART_HISTORY_LIMIT),
    isCardioTimed
      ? Promise.resolve(null)
      : fetchExerciseProgressDetail(supabase, user.id, exercise.id),
    isCardioTimed
      ? fetchCardioTimedProgressDetail(supabase, user.id, exercise.id)
      : Promise.resolve(null),
  ])
  // Phase 2W: chartEntries feeds the trend charts (up to 15 sessions);
  // recentEntries keeps the exact Phase 2V shape — same newest-first
  // order, capped at 5 — for the header count, history lists, and the
  // entries[0]/entries[1] comparable-session signal.
  const chartEntries = historyMap[exercise.id] ?? []
  const recentEntries = chartEntries.slice(0, RECENT_HISTORY_LIMIT)

  // ── Shared header pieces ─────────────────────────────────────────
  const headerParts = [
    optionLabel(PRIMARY_MUSCLES, exercise.primary_muscle as PrimaryMuscle | null),
    optionLabel(EXERCISE_EQUIPMENT, exercise.equipment as ExerciseEquipment | null),
    optionLabel(TRACKING_MODES, trackingMode),
    isUnilateral ? 'Unilateral' : null,
  ].filter((part): part is string => part !== null)

  const suffix = isUnilateral ? ' per side' : ''

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <Link href="/progress" className="inline-flex min-h-11 items-center gap-1 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="w-3 h-3" aria-hidden="true" />
        Progress
      </Link>

      <div>
        <h1 className="text-xl font-bold text-ink break-words">{exercise.name}</h1>
        {headerParts.length > 0 && (
          <p className="text-sm text-ink-muted mt-0.5">{headerParts.join(' · ')}</p>
        )}
        <p className="text-xs text-ink-muted mt-1">
          {recentEntries.length === 0
            ? 'No recent sessions'
            : `${recentEntries.length} recent session${recentEntries.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <ProgressSubNav fastingEnabled={profile.fasting_enabled} />

      {isCardioTimed ? (
        <CardioTimedSections
          trackingMode={trackingMode}
          exerciseId={exercise.id}
          aggregate={cardioTimedDetail!}
          recentEntries={recentEntries}
          chartEntries={chartEntries}
        />
      ) : (
        <StrengthSections
          trackingMode={trackingMode}
          detail={strengthDetail!}
          recentEntries={recentEntries}
          chartEntries={chartEntries}
          suffix={suffix}
        />
      )}
    </div>
  )
}

// ── weight_reps / bodyweight sections ───────────────────────────────

function StrengthSections({
  trackingMode,
  detail,
  recentEntries,
  chartEntries,
  suffix,
}: {
  trackingMode: TrackingMode
  detail: ExerciseProgressDetail
  recentEntries: ExerciseHistoryEntry[]
  chartEntries: ExerciseHistoryEntry[]
  suffix: string
}) {
  const isBodyweightMode = trackingMode === 'bodyweight'

  // Phase 2W trend charts — pure adapters over the same history the
  // rest of the page uses; no new metric or representative-set rules.
  const weightRepsTrend = isBodyweightMode ? null : buildWeightRepsTrend(chartEntries)
  const bodyweightTrends = isBodyweightMode ? buildBodyweightTrends(chartEntries) : null

  // Synthetic WorkoutSet for suggestNextTarget/formatPreviousBest —
  // same convention fetchPreviousBests already establishes elsewhere.
  // Coaching is deliberately derived from the latest COMPLETED
  // HISTORICAL set only — never any in-progress workout, since this
  // read-only page has no session context.
  const previousBestSet: WorkoutSet | null = detail.mostRecentBest
    ? {
        id: '',
        workout_exercise_id: detail.exerciseId,
        set_number: 0,
        weight_kg: detail.mostRecentBest.weightKg,
        reps: detail.mostRecentBest.reps,
        rpe: detail.mostRecentBest.rpe,
        completed: true,
        is_warmup: false,
        notes: null,
        duration_seconds: null,
        distance_meters: null,
        created_at: detail.mostRecentBest.workoutDate,
      }
    : null

  const prevSummary = formatPreviousBest(previousBestSet, detail.trackingMode)
  const nextTarget = suggestNextTarget(
    previousBestSet,
    detail.isUnilateral,
    detail.trackingMode,
    detail.equipment,
    detail.trend
  )

  const trendLabel =
    detail.trend === 'improving'
      ? 'Improving'
      : detail.trend === 'stalling'
      ? 'Possible stall'
      : detail.trend === 'steady'
      ? 'Steady'
      : null // 'needs-data' — don't pretend a trend exists

  // Bodyweight (Phase 2V): Best added weight only when a genuinely
  // positive added weight exists — never "0 lbs" (the display-rounded
  // value must also be positive, so 0.1 kg doesn't round down to a
  // nonsensical zero). Estimated 1RM is omitted entirely: a
  // body-plus-added-weight rep isn't a barbell 1RM candidate.
  const addedWeightLbs =
    isBodyweightMode && detail.maxWeightKg !== null
      ? Math.round(kgToLbs(detail.maxWeightKg))
      : null
  const showAddedWeight = addedWeightLbs !== null && addedWeightLbs > 0

  const hasAnyRecord = isBodyweightMode
    ? detail.maxBodyweightReps !== null || showAddedWeight
    : detail.maxWeightKg !== null ||
      detail.maxEstimated1RmKg !== null ||
      detail.maxBodyweightReps !== null

  function formatPrEventLine(e: PREvent) {
    const dateLabel = format(parseISO(e.workoutDate), 'MMM d')
    const typeLabel =
      e.type === 'weight' ? 'Weight PR' : e.type === 'estimated_1rm' ? 'Est. 1RM PR' : 'Rep PR'
    const valueText =
      e.type === 'weight'
        ? `${Math.round(kgToLbs(e.weightKg as number))} lbs${
            e.reps !== null ? ` × ${e.reps}` : ''
          }${suffix}`
        : e.type === 'estimated_1rm'
        ? `${Math.round(kgToLbs(e.estimated1RmKg as number))} lbs${suffix}`
        : `${e.reps} reps${suffix}`
    return `${dateLabel} — ${typeLabel} — ${valueText}`
  }

  const visiblePrHistory = detail.prHistory.slice(0, PR_HISTORY_INITIAL_CAP)
  const remainingPrHistory = detail.prHistory.slice(PR_HISTORY_INITIAL_CAP)

  return (
    <>
      {/* A. Current records */}
      <Card variant="elevated" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Current records</h2>
        {!hasAnyRecord ? (
          <p className="text-sm text-ink-muted">No records yet.</p>
        ) : isBodyweightMode ? (
          <div className="space-y-1">
            {detail.maxBodyweightReps !== null && (
              <p className="text-sm text-ink">
                Best reps: {detail.maxBodyweightReps} reps{suffix}
              </p>
            )}
            {showAddedWeight && (
              <p className="text-sm text-ink">
                Best added weight: +{addedWeightLbs} lbs{suffix}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {detail.maxWeightKg !== null && (
              <p className="text-sm text-ink">
                Weight PR: {Math.round(kgToLbs(detail.maxWeightKg))} lbs{suffix}
              </p>
            )}
            {detail.maxEstimated1RmKg !== null && (
              <p className="text-sm text-ink">
                Est. 1RM: {Math.round(kgToLbs(detail.maxEstimated1RmKg))} lbs{suffix}
              </p>
            )}
            {detail.maxBodyweightReps !== null && (
              <p className="text-sm text-ink">Rep PR: {detail.maxBodyweightReps} reps</p>
            )}
          </div>
        )}
        </CardContent>
      </Card>

      {/* A2. Trend charts (Phase 2W) — after records, before coaching.
          weight_reps: one chart, estimated 1RM preferred over best
          working weight (never both). bodyweight: a reps chart plus a
          separate, smaller, conditional added-weight chart — never
          two metrics on one axis. */}
      {isBodyweightMode ? (
        <>
          <ExerciseTrendChart
            title="Reps"
            points={bodyweightTrends?.reps?.points ?? []}
            summary={bodyweightTrends?.reps?.summary}
          />
          {bodyweightTrends?.addedWeight && (
            <ExerciseTrendChart
              title={bodyweightTrends.addedWeight.title}
              points={bodyweightTrends.addedWeight.points}
              summary={bodyweightTrends.addedWeight.summary}
              compact
            />
          )}
        </>
      ) : (
        <ExerciseTrendChart
          title={weightRepsTrend?.title ?? 'Strength trend'}
          points={weightRepsTrend?.points ?? []}
          summary={weightRepsTrend?.summary}
        />
      )}

      {/* B. Current coaching */}
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Current coaching</h2>
        {previousBestSet && (
          <p className="text-sm text-ink-muted">Last: {prevSummary}</p>
        )}
        <p className="text-sm text-ink-muted">{nextTarget.message}</p>
        {trendLabel && <p className="text-sm text-ink-muted">Trend: {trendLabel}</p>}
        </CardContent>
      </Card>

      {/* C. Recent best sets */}
      <Card variant="subtle" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Recent best sets</h2>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-ink-muted">No completed sets yet.</p>
        ) : (
          <ul className="space-y-1">
            {recentEntries.map((entry, i) => {
              // Bodyweight mode renders through the shared
              // tracking-aware formatter ("12 reps · +25 lbs"), so an
              // added-weight set never reads like a barbell lift.
              // weight_reps keeps its established rendering, est. 1RM
              // extra included.
              if (isBodyweightMode) {
                const summary = formatTrackingAwareSetSummary(entry, trackingMode)
                if (!summary) return null
                return (
                  <li key={i} className="text-xs text-ink-muted">
                    {format(parseISO(entry.workoutDate), 'MMM d')} — {summary}
                  </li>
                )
              }
              const isBodyweightSet = !entry.weightKg || entry.weightKg <= 0
              const mainText = isBodyweightSet
                ? entry.reps !== null
                  ? `${entry.reps} reps`
                  : '—'
                : entry.reps !== null
                ? `${Math.round(kgToLbs(entry.weightKg as number))} lbs × ${entry.reps}${suffix}`
                : `${Math.round(kgToLbs(entry.weightKg as number))} lbs${suffix}`
              const extras: string[] = []
              if (entry.rpe !== null) extras.push(`RPE ${entry.rpe}`)
              if (!isBodyweightSet && entry.estimated1RmKg !== null) {
                extras.push(`est. 1RM ${Math.round(kgToLbs(entry.estimated1RmKg))} lbs`)
              }
              return (
                <li key={i} className="text-xs text-ink-muted">
                  {format(parseISO(entry.workoutDate), 'MMM d')} — {mainText}
                  {extras.length > 0 ? ` · ${extras.join(' · ')}` : ''}
                </li>
              )
            })}
          </ul>
        )}
        </CardContent>
      </Card>

      {/* D. PR history */}
      <Card variant="default" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">PR history</h2>
        {detail.prHistory.length === 0 ? (
          <p className="text-sm text-ink-muted">No PRs yet.</p>
        ) : (
          <>
            <ul className="space-y-1.5">
              {visiblePrHistory.map((e, i) => (
                <li key={i} className="text-xs text-ink">
                  {formatPrEventLine(e)}
                </li>
              ))}
            </ul>
            {remainingPrHistory.length > 0 && (
              <details>
                <summary className="text-xs text-brand hover:underline cursor-pointer">
                  Show all ({remainingPrHistory.length} more)
                </summary>
                <ul className="space-y-1.5 mt-1.5">
                  {remainingPrHistory.map((e, i) => (
                    <li key={i} className="text-xs text-ink">
                      {formatPrEventLine(e)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
        </CardContent>
      </Card>
    </>
  )
}

// ── cardio / timed sections (Phase 2V) ──────────────────────────────

function CardioTimedSections({
  trackingMode,
  exerciseId,
  aggregate,
  recentEntries,
  chartEntries,
}: {
  trackingMode: TrackingMode
  exerciseId: string
  aggregate: {
    bestDistanceMeters: number | null
    longestDurationSeconds: number | null
    bestPaceDurationSeconds: number | null
    bestPaceDistanceMeters: number | null
  }
  recentEntries: ExerciseHistoryEntry[]
  chartEntries: ExerciseHistoryEntry[]
}) {
  const isCardio = trackingMode === 'cardio'

  // Phase 2W trend charts. cardio: pace → duration → distance
  // priority, distance as a conditional secondary chart. timed:
  // duration only, RPE in tooltips.
  const cardioTrends = isCardio ? buildCardioTrends(chartEntries) : null
  const timedTrend = isCardio ? null : buildTimedTrend(chartEntries)

  // Formatters return null for missing/non-positive values, so a
  // metric that doesn't exist is omitted entirely — never rendered as
  // a zero, a dash placeholder, or a dangling separator.
  const longestDuration = formatDurationSeconds(aggregate.longestDurationSeconds)
  const bestDistance = isCardio ? formatDistanceMeters(aggregate.bestDistanceMeters) : null
  const bestPace = isCardio
    ? formatPaceSecondsPerMile(aggregate.bestPaceDurationSeconds, aggregate.bestPaceDistanceMeters)
    : null

  const hasAnyRecord = longestDuration !== null || bestDistance !== null || bestPace !== null

  const latest = recentEntries[0] ?? null
  const priorComparable = recentEntries[1] ?? null

  const latestSummary = latest ? formatTrackingAwareSetSummary(latest, trackingMode) : ''

  // Comparable-session signal: reuse trackingAwareProgressSignal
  // through the synthetic-WorkoutSet adapter — the comparison rules
  // (pace-primary for cardio, duration-only fallback, ±1% thresholds)
  // live only in workout.ts. Only shown when a prior comparable
  // session actually exists; a first-ever session gets no badge
  // rather than a meaningless "New exercise".
  const signal =
    latest && priorComparable
      ? trackingAwareProgressSignal(
          toSyntheticWorkoutSet(latest, exerciseId),
          toSyntheticWorkoutSet(priorComparable, exerciseId),
          trackingMode
        )
      : null

  // Latest timed RPE comes from history (entries[0]) only — the
  // aggregate deliberately doesn't duplicate it.
  const latestRpe = !isCardio && latest && latest.rpe !== null ? latest.rpe : null

  return (
    <>
      {/* A. All-time records */}
      <Card variant="elevated" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">All-time records</h2>
        {!hasAnyRecord ? (
          <p className="text-sm text-ink-muted">No completed sessions yet.</p>
        ) : (
          <div className="space-y-1">
            {bestDistance && (
              <p className="text-sm text-ink">Best distance: {bestDistance}</p>
            )}
            {longestDuration && (
              <p className="text-sm text-ink">Longest duration: {longestDuration}</p>
            )}
            {bestPace && <p className="text-sm text-ink">Best pace: {bestPace}</p>}
            {latestRpe !== null && (
              <p className="text-sm text-ink">Latest RPE: {latestRpe}</p>
            )}
          </div>
        )}
        </CardContent>
      </Card>

      {/* A2. Trend charts (Phase 2W) — after all-time records, before
          most recent session. */}
      {isCardio ? (
        <>
          <ExerciseTrendChart
            title={cardioTrends?.primary?.title ?? 'Cardio trend'}
            points={cardioTrends?.primary?.points ?? []}
            summary={cardioTrends?.primary?.summary}
            footnote={cardioTrends?.primary?.footnote}
          />
          {cardioTrends?.secondary && (
            <ExerciseTrendChart
              title={cardioTrends.secondary.title}
              points={cardioTrends.secondary.points}
              summary={cardioTrends.secondary.summary}
              compact
            />
          )}
        </>
      ) : (
        <ExerciseTrendChart
          title={timedTrend?.title ?? 'Duration'}
          points={timedTrend?.points ?? []}
          summary={timedTrend?.summary}
        />
      )}

      {/* B. Most recent session */}
      <Card variant="metric" className="gap-0 py-4">
        <CardContent className="space-y-1.5">
        <h2 className="text-sm font-semibold text-ink">Most recent session</h2>
        {!latest || !latestSummary ? (
          <p className="text-sm text-ink-muted">No completed sessions yet.</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-ink">
              {format(parseISO(latest.workoutDate), 'MMM d')} — {latestSummary}
            </p>
            {signal && (
              <p className="text-xs text-ink-muted">
                Vs. previous session: {SIGNAL_TEXT[signal] ?? progressLabel(signal)}
              </p>
            )}
          </div>
        )}
        </CardContent>
      </Card>

      {/* C. Recent history */}
      <Card variant="subtle" className="gap-0 py-4">
        <CardContent className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Recent history</h2>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-ink-muted">No completed sessions yet.</p>
        ) : (
          <ul className="space-y-1">
            {recentEntries.map((entry, i) => {
              const summary = formatTrackingAwareSetSummary(entry, trackingMode)
              if (!summary) return null
              return (
                <li key={i} className="text-xs text-ink-muted">
                  {format(parseISO(entry.workoutDate), 'MMM d')} — {summary}
                </li>
              )
            })}
          </ul>
        )}
        </CardContent>
      </Card>
    </>
  )
}
