'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionHeader } from '@/components/workout/SessionHeader'
import { WorkoutExerciseBlock } from '@/components/workout/WorkoutExerciseBlock'
import { AddExerciseSection } from '@/components/workout/AddExerciseSection'

interface WorkoutDetailClientProps {
  session: any; exercises: any[]; previousBests: Record<string, any>
  allExercises: any[]; routineId?: string | null; routineName?: string | null
}

export function WorkoutDetailClient({ session, exercises, previousBests, allExercises, routineId, routineName }: WorkoutDetailClientProps) {
  const router = useRouter()
  const [sessionDeleted, setSessionDeleted] = useState(false)
  function handleSessionDeleted() { setSessionDeleted(true); router.replace('/workouts') }
  if (sessionDeleted) {
    return (
      <div className="shred-card text-center py-8 space-y-1">
        <p className="text-sm font-medium text-foreground">Workout deleted.</p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    )
  }
  return (
    <>
      <SessionHeader session={session} routineId={routineId} routineName={routineName} onSessionDeleted={handleSessionDeleted} />
      {exercises.length === 0 && <div className="shred-card text-center py-6 text-sm text-muted-foreground">No exercises yet. Add your first exercise below.</div>}
      {exercises.map((we: any) => <WorkoutExerciseBlock key={we.id} we={we} previousBest={previousBests[we.exercise_id] ?? null} />)}
      <AddExerciseSection exercises={allExercises} workoutId={session.id} />
    </>
  )
}
