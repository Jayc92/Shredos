'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionHeader } from '@/components/workout/SessionHeader'
import { WorkoutExerciseBlock } from '@/components/workout/WorkoutExerciseBlock'
import { AddExerciseSection } from '@/components/workout/AddExerciseSection'
import { WorkoutCompletionSummaryCard } from '@/components/workout/WorkoutCompletionSummaryCard'
import { WorkoutSessionNotes } from '@/components/workout/WorkoutSessionNotes'
import { SaveAsRoutineButton } from '@/components/workout/SaveAsRoutineButton'
import { RepeatWorkoutButton } from '@/components/workout/RepeatWorkoutButton'
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

  // UI-5B1B exercise reordering: an ID-ORDER overlay rather than
  // copied exercise objects, so every server refresh (set saves,
  // add/remove) keeps flowing fresh data into the blocks while the
  // optimistic order applies on top. The transactional
  // exercise-order endpoint (migration 021 RPC) is the integrity
  // authority; on failure the previous order is restored, an
  // accessible error is shown, and the page refreshes to server
  // truth. Completed workouts may reorder too — the RPC can only
  // touch presentation order, never logged evidence.
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)

  const orderedExercises = orderOverride
    ? [...exercises].sort((a: any, b: any) => {
        const ai = orderOverride.indexOf(a.id)
        const bi = orderOverride.indexOf(b.id)
        // Ids unknown to the override (e.g. just added) keep their
        // server position after the known ones.
        if (ai === -1 && bi === -1) return 0
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    : exercises

  async function moveExercise(index: number, direction: -1 | 1) {
    if (reordering) return
    const target = index + direction
    if (target < 0 || target >= orderedExercises.length) return

    const previousOrder = orderedExercises.map((we: any) => we.id)
    const nextOrder = [...previousOrder]
    ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]

    setOrderOverride(nextOrder)
    setReordering(true)
    setReorderError(null)

    const res = await fetch(`/api/workouts/${session.id}/exercise-order`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordered_ids: nextOrder }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setOrderOverride(previousOrder)
      setReorderError(body.error ?? 'Reorder failed — please try again.')
    }
    setReordering(false)
    router.refresh()
  }

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

      {/* UI-5B2 workout reuse: Save as routine on live AND completed
          workouts; Repeat only on completed ones. Both are thin
          clients over the migration 022 RPCs. */}
      <div className="flex flex-wrap items-start gap-2">
        <SaveAsRoutineButton workoutId={session.id} workoutTitle={session.title} />
        {readOnly && <RepeatWorkoutButton workoutId={session.id} />}
      </div>

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

      {reorderError && (
        <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1" aria-live="polite">
          {reorderError}
        </p>
      )}

      {orderedExercises.map((we: any, index: number) => (
        <WorkoutExerciseBlock
          key={we.id}
          we={we}
          previousBest={previousBests[we.exercise_id] ?? null}
          trend={exerciseTrends?.[we.exercise_id]}
          history={exerciseHistory?.[we.exercise_id]}
          prBaseline={prBaseline?.[we.exercise_id]}
          readOnly={readOnly}
          isFirst={index === 0}
          isLast={index === orderedExercises.length - 1}
          isReordering={reordering}
          onMoveUp={() => moveExercise(index, -1)}
          onMoveDown={() => moveExercise(index, 1)}
        />
      ))}

      {!readOnly && <AddExerciseSection exercises={allExercises} workoutId={session.id} />}
    </>
  )
}
