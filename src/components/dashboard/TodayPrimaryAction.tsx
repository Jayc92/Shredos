// ============================================================
// ForgeFitOS — Today primary action (Phase 4B.3)
//
// The most immediately actionable training state leads the page,
// using ONLY existing authoritative data:
//
//   1. A true active workout exists (findActiveTrainingSession —
//      the Phase 2K helper the workout APIs already use): resume it,
//      routing to the existing /workouts/[id] detail page.
//   2. Otherwise: start a workout, routing to the existing
//      /workouts page. Recent context (sessions this week) comes
//      from the already-fetched week stats.
//
// No new active-workout logic, no recommendation engine, no
// automatic plan changes — this is deterministic display hierarchy
// over data the page already had (plus the existing session
// finder). Server component; the buttons are plain links.
// ============================================================

import Link from 'next/link'
import { Dumbbell, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { WorkoutWeekStats } from '@/types/app'

interface TodayPrimaryActionProps {
  /** Id of the true active training session, or null. */
  activeSessionId: string | null
  stats: WorkoutWeekStats
}

export function TodayPrimaryAction({ activeSessionId, stats }: TodayPrimaryActionProps) {
  const sessions = stats.sessions_this_week

  if (activeSessionId) {
    return (
      <Card variant="action" className="gap-0 py-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-subtle"
            >
              <Dumbbell className="h-5 w-5 text-brand-active" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">Workout in progress</h2>
              <p className="text-xs text-ink-muted">
                Pick up where you left off — your sets are saved as you go.
              </p>
            </div>
          </div>
          <Link
            href={`/workouts/${activeSessionId}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Resume workout
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="action" className="gap-0 py-4">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand-subtle"
          >
            <Dumbbell className="h-5 w-5 text-brand-active" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">Train today</h2>
            <p className="text-xs text-ink-muted">
              {sessions > 0
                ? `${sessions} session${sessions !== 1 ? 's' : ''} logged this week.`
                : 'No sessions logged this week yet.'}
            </p>
          </div>
        </div>
        <Link
          href="/workouts"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          Start workout
        </Link>
      </CardContent>
    </Card>
  )
}
