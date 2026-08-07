'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionHeader } from '@/components/workout/SessionHeader'
import { WorkoutExerciseBlock } from '@/components/workout/WorkoutExerciseBlock'
import { AddExerciseSection } from '@/components/workout/AddExerciseSection'
import { WorkoutCompletionSummaryCard } from '@/components/workout/WorkoutCompletionSummaryCard'
import { WorkoutSessionNotes } from '@/components/workout/WorkoutSessionNotes'
import { summarizeWorkout } from '@/lib/workout'
import { Card, CardContent } from '@/components/ui/card'
import type { ProgressionTrend } from '@/lib/workout-coach'
import type { ExerciseHistoryEntry, PRBaseline } from '@/lib/workout'

interface WorkoutDetailClientProps {
  session: any
  exercises: any[]
  previousBests: Record<string, any>
  allExercises: any[]
  routineId?: string | null
  routineName?: string | null
  exerciseTrends?: Record<string, ProgressionTrend>
  exerciseHistory?: Record<string, ExerciseHistoryEntry[]>
  prBaseline?: Record<string, PRBaseline>
}

export function WorkoutDetailClient({
  session, exercises, previousBests, allExercises,
  routineId, routineName, exerciseTrends, exerciseHistory, prBaseline,
}: WorkoutDetailClientProps) {
  const router = useRouter()
  const [sessionDeleted, setSessionDeleted] = useState(false)

  function handleSessionDeleted() {
    setSessionDeleted(true)
    router.replace('/workouts')
  }

  if (sessionDeleted) {
    return (
      <Card variant="status" className="gap-0 py-8">
        <CardContent className="space-y-1 text-center">
          <p className="text-sm font-medium text-ink">Workout deleted.</p>
          <p className="text-xs text-ink-muted">Redirecting…</p>
        </CardContent>
      </Card>
    )
  }

  // Phase 2H: recomputed every render from already-loaded session data —
  // no persisted summary blob, so reopening a completed workout later
  // shows the identical summary automatically.
  const completionSummary =
    session.status === 'completed' ? summarizeWorkout(exercises, prBaseline ?? {}) : null

  // Phase 2I: a completed workout is read-only in the UI, mirroring
  // the same lock enforced server-side by the mutation guards.
  const readOnly = session.status === 'completed'

  return (
    <>
      {completionSummary && (
        <WorkoutCompletionSummaryCard
          summary={completionSummary}
          startTime={session.start_time}
          endTime={session.end_time}
          completedDurationSeconds={session.completed_duration_seconds}
          notes={session.notes}
        />
      )}

      <SessionHeader
        session={session}
        routineId={routineId}
        routineName={routineName}
        onSessionDeleted={handleSessionDeleted}
      />

      <WorkoutSessionNotes
        sessionId={session.id}
        notes={session.notes}
        status={session.status}
      />

      {exercises.length === 0 && (
        <Card variant="status" className="gap-0 py-6">
          <CardContent className="text-center text-sm text-ink-muted">
            No exercises yet. Add your first exercise below.
          </CardContent>
        </Card>
      )}

      {exercises.map((we: any) => (
        <WorkoutExerciseBlock
          key={we.id}
          we={we}
          previousBest={previousBests[we.exercise_id] ?? null}
          trend={exerciseTrends?.[we.exercise_id]}
          history={exerciseHistory?.[we.exercise_id]}
          prBaseline={prBaseline?.[we.exercise_id]}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && <AddExerciseSection exercises={allExercises} workoutId={session.id} />}
    </>
  )
}
