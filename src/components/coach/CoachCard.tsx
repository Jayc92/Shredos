'use client'

import Link from 'next/link'
import { StartWorkoutButton } from '@/components/routine/StartWorkoutButton'
import { Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { CoachSummary } from '@/lib/workout-coach'

interface CoachCardProps {
  summary: CoachSummary
}

export function CoachCard({ summary }: CoachCardProps) {
  const {
    hasEnoughData,
    topRoutine,
    routineReasonText,
    fallbackFocusText,
    freshMuscles,
    recoveringMuscles,
    weekStats,
  } = summary

  return (
    <Card variant="status" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-ink-muted" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink">Training coach</h2>
        {hasEnoughData && (
          <span className="ml-auto text-xs text-ink-muted">
            {weekStats.sessionsThisWeek} session{weekStats.sessionsThisWeek !== 1 ? 's' : ''} this week
          </span>
        )}
      </div>

      {!hasEnoughData ? (
        <div className="space-y-1.5">
          <p className="text-xs text-ink-muted">
            Log a few workouts to see personalised training recommendations.
          </p>
          <Link href="/workouts" className="text-xs text-brand hover:underline">
            Start logging workouts →
          </Link>
        </div>
      ) : topRoutine ? (
        <>
          <div>
            <p className="text-xs text-ink-muted mb-0.5">Recommended today</p>
            <p className="text-sm font-semibold text-ink">{topRoutine.name}</p>
            {routineReasonText && (
              <p className="text-xs text-ink-muted mt-0.5">{routineReasonText}</p>
            )}
          </div>

          {recoveringMuscles.length > 0 && (
            <p className="text-xs text-ink-muted">
              Keep light: {recoveringMuscles.slice(0, 3).map(m => m.label).join(', ')}
            </p>
          )}

          <StartWorkoutButton
            routineId={topRoutine.id}
            routineName={topRoutine.name}
            isActive={topRoutine.is_active}
          />
        </>
      ) : (
        <>
          {fallbackFocusText && (
            <div>
              <p className="text-xs text-ink-muted mb-0.5">Suggested focus</p>
              <p className="text-sm font-medium text-ink">{fallbackFocusText}</p>
            </div>
          )}
          {freshMuscles.length > 0 && (
            <p className="text-xs text-ink-muted">
              Ready: {freshMuscles.slice(0, 3).map(m => m.label).join(', ')}
            </p>
          )}
          {recoveringMuscles.length > 0 && (
            <p className="text-xs text-ink-muted">
              Keep light: {recoveringMuscles.slice(0, 3).map(m => m.label).join(', ')}
            </p>
          )}
          <Link href="/workouts/routines" className="text-xs text-brand hover:underline block">
            Create a routine to get recommendations →
          </Link>
        </>
      )}
      </CardContent>
    </Card>
  )
}
