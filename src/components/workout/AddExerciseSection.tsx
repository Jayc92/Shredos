'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ExercisePicker } from './ExercisePicker'
import type { Exercise } from '@/types/database'

interface AddExerciseSectionProps {
  exercises: Exercise[]
  workoutId: string
}

export function AddExerciseSection({ exercises, workoutId }: AddExerciseSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      {open ? (
        <ExercisePicker
          exercises={exercises}
          workoutId={workoutId}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full shred-card flex items-center justify-center gap-2 py-3 text-sm text-primary hover:border-primary/50 transition-colors border-dashed"
        >
          <Plus className="w-4 h-4" />
          Add exercise
        </button>
      )}
    </div>
  )
}
