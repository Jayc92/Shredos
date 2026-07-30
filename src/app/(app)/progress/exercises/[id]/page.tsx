import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { fetchUserProfile, fetchExerciseHistory } from '@/lib/supabase/server'
import { fetchExerciseProgressDetail } from '@/lib/strength-records'
import type { PREvent } from '@/lib/strength-records'
import { formatPreviousBest, suggestNextTarget } from '@/lib/workout'
import { kgToLbs } from '@/lib/units'
import type { WorkoutSet } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exercise progress' }

const PR_HISTORY_INITIAL_CAP = 10

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

  const detail = await fetchExerciseProgressDetail(supabase, user.id, params.id)
  if (!detail) notFound()

  // Cardio/timed don't get a strength-progression detail page —
  // /progress's own Strength Records list already excludes them (via
  // tracking_mode, Phase 2R), so this only matters for someone hitting
  // the URL directly.
  if (detail.trackingMode === 'cardio' || detail.trackingMode === 'timed') {
    redirect('/progress')
  }

  // Recent best sets — reuse fetchExerciseHistory exactly as the
  // workout-detail page does. No current session to exclude (this
  // page has no session context at all), and a higher display limit
  // than the compact in-session view needs.
  const historyMap = await fetchExerciseHistory(
    supabase,
    user.id,
    [detail.exerciseId],
    undefined,
    10
  )
  const recentBestSets = historyMap[detail.exerciseId] ?? []

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

  const prevSummary = formatPreviousBest(previousBestSet)
  const nextTarget = suggestNextTarget(
    previousBestSet,
    detail.isUnilateral,
    detail.trackingMode,
    detail.equipment,
    detail.trend
  )

  const suffix = detail.isUnilateral ? ' per side' : ''
  const trendLabel =
    detail.trend === 'improving'
      ? 'Improving'
      : detail.trend === 'stalling'
      ? 'Possible stall'
      : detail.trend === 'steady'
      ? 'Steady'
      : null // 'needs-data' — don't pretend a trend exists

  const hasAnyRecord =
    detail.maxWeightKg !== null || detail.maxEstimated1RmKg !== null || detail.maxBodyweightReps !== null

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
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <Link href="/progress" className="text-xs text-muted-foreground hover:text-foreground">
        ← Progress
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">{detail.exerciseName}</h1>
      </div>

      {/* A. Current records */}
      <div className="shred-card space-y-1.5">
        <h2 className="text-sm font-semibold text-foreground">Current records</h2>
        {!hasAnyRecord ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <div className="space-y-1">
            {detail.maxWeightKg !== null && (
              <p className="text-sm text-foreground">
                Weight PR: {Math.round(kgToLbs(detail.maxWeightKg))} lbs{suffix}
              </p>
            )}
            {detail.maxEstimated1RmKg !== null && (
              <p className="text-sm text-foreground">
                Est. 1RM: {Math.round(kgToLbs(detail.maxEstimated1RmKg))} lbs{suffix}
              </p>
            )}
            {detail.maxBodyweightReps !== null && (
              <p className="text-sm text-foreground">Rep PR: {detail.maxBodyweightReps} reps</p>
            )}
          </div>
        )}
      </div>

      {/* B. Current coaching */}
      <div className="shred-card space-y-1.5">
        <h2 className="text-sm font-semibold text-foreground">Current coaching</h2>
        {previousBestSet && (
          <p className="text-sm text-muted-foreground">Last: {prevSummary}</p>
        )}
        <p className="text-sm text-muted-foreground">{nextTarget.message}</p>
        {trendLabel && <p className="text-sm text-muted-foreground">Trend: {trendLabel}</p>}
      </div>

      {/* C. Recent best sets */}
      <div className="shred-card space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Recent best sets</h2>
        {recentBestSets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed sets yet.</p>
        ) : (
          <ul className="space-y-1">
            {recentBestSets.map((entry, i) => {
              const isBodyweight = !entry.weightKg || entry.weightKg <= 0
              const mainText = isBodyweight
                ? entry.reps !== null
                  ? `${entry.reps} reps`
                  : '—'
                : entry.reps !== null
                ? `${Math.round(kgToLbs(entry.weightKg as number))} lbs × ${entry.reps}${suffix}`
                : `${Math.round(kgToLbs(entry.weightKg as number))} lbs${suffix}`
              const extras: string[] = []
              if (entry.rpe !== null) extras.push(`RPE ${entry.rpe}`)
              if (!isBodyweight && entry.estimated1RmKg !== null) {
                extras.push(`est. 1RM ${Math.round(kgToLbs(entry.estimated1RmKg))} lbs`)
              }
              return (
                <li key={i} className="text-xs text-muted-foreground">
                  {format(parseISO(entry.workoutDate), 'MMM d')} — {mainText}
                  {extras.length > 0 ? ` · ${extras.join(' · ')}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* D. PR history */}
      <div className="shred-card space-y-2">
        <h2 className="text-sm font-semibold text-foreground">PR history</h2>
        {detail.prHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No PRs yet.</p>
        ) : (
          <>
            <ul className="space-y-1.5">
              {visiblePrHistory.map((e, i) => (
                <li key={i} className="text-xs text-foreground">
                  {formatPrEventLine(e)}
                </li>
              ))}
            </ul>
            {remainingPrHistory.length > 0 && (
              <details>
                <summary className="text-xs text-primary hover:underline cursor-pointer">
                  Show all ({remainingPrHistory.length} more)
                </summary>
                <ul className="space-y-1.5 mt-1.5">
                  {remainingPrHistory.map((e, i) => (
                    <li key={i} className="text-xs text-foreground">
                      {formatPrEventLine(e)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  )
}
