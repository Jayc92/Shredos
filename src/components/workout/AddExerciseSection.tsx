'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ExercisePicker } from './ExercisePicker'
import type { Exercise } from '@/types/database'

interface AddExerciseSectionProps {
  exercises: Exercise[]
  workoutId: string
}

export function AddExerciseSection({ exercises, workoutId }: AddExerciseSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleAdd(exerciseId: string) {
    await fetch(`/api/workouts/${workoutId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    router.refresh()
  }

  return (
    <div>
      {open ? (
        <ExercisePicker
          exercises={exercises}
          onAdd={handleAdd}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-edge bg-surface py-3 text-sm text-brand hover:border-brand/50 transition-colors min-h-11"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add exercise
        </button>
      )}
    </div>
  )
}
