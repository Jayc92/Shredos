'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoutineForm } from './RoutineForm'
import { RoutineExerciseRow } from './RoutineExerciseRow'
import { StartWorkoutButton } from './StartWorkoutButton'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { cn } from '@/lib/utils'
import { Pencil, EyeOff, Trash2, Plus } from 'lucide-react'
import type { WorkoutRoutineWithExercises, Exercise } from '@/types/database'

interface RoutineDetailClientProps {
  routine: WorkoutRoutineWithExercises
  allExercises: Exercise[]
}

export function RoutineDetailClient({ routine, allExercises }: RoutineDetailClientProps) {
  const router = useRouter()
  const [editingMeta, setEditingMeta] = useState(false)
  const [showPicker,  setShowPicker]  = useState(false)
  const [toggling,    setToggling]    = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteErr,   setDeleteErr]   = useState<string | null>(null)

  const exercises = (routine.workout_routine_exercises ?? [])
    .slice().sort((a, b) => a.order_index - b.order_index)

  async function handleAddExercise(exerciseId: string) {
    await fetch(`/api/routines/${routine.id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    router.refresh()
  }

  async function handleMoveUp(idx: number) {
    if (idx === 0) return
    const curr = exercises[idx]
    const prev = exercises[idx - 1]
    await Promise.all([
      fetch(`/api/routine-exercises/${curr.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: prev.order_index }),
      }),
      fetch(`/api/routine-exercises/${prev.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: curr.order_index }),
      }),
    ])
    router.refresh()
  }

  async function handleMoveDown(idx: number) {
    if (idx === exercises.length - 1) return
    const curr = exercises[idx]
    const next = exercises[idx + 1]
    await Promise.all([
      fetch(`/api/routine-exercises/${curr.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: next.order_index }),
      }),
      fetch(`/api/routine-exercises/${next.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: curr.order_index }),
      }),
    ])
    router.refresh()
  }

  async function toggleActive() {
    const action = routine.is_active ? 'Deactivate' : 'Reactivate'
    if (!confirm(`${action} "${routine.name}"?`)) return
    setToggling(true)
    await fetch(`/api/routines/${routine.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !routine.is_active }),
    })
    router.refresh()
    setToggling(false)
  }

  async function handleDelete() {
    setDeleteErr(null)
    if (!confirm(`Delete "${routine.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/routines/${routine.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setDeleteErr(body.error ?? 'Delete failed.')
      setDeleting(false)
      return
    }
    router.push('/workouts/routines')
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <a href="/workouts/routines" className="text-xs text-muted-foreground hover:text-foreground">
        ← Routines
      </a>

      {/* Metadata card */}
      <div className="shred-card space-y-2">
        {editingMeta ? (
          <RoutineForm existing={routine} onClose={() => { setEditingMeta(false); router.refresh() }} />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-foreground">{routine.name}</h1>
                {routine.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{routine.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {routine.goal && (
                    <span className="text-xs rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
                      {routine.goal}
                    </span>
                  )}
                  {routine.primary_muscle_focus && (
                    <span className="text-xs rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
                      {routine.primary_muscle_focus.replace('_', ' ')}
                    </span>
                  )}
                  {routine.difficulty && (
                    <span className="text-xs rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">
                      {routine.difficulty}
                    </span>
                  )}
                  {routine.estimated_duration_minutes && (
                    <span className="text-xs text-muted-foreground">∼{routine.estimated_duration_minutes} min</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setEditingMeta(true)} aria-label="Edit"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={toggleActive} disabled={toggling} aria-label={routine.is_active ? 'Deactivate' : 'Reactivate'}
                  className="p-1.5 text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-40">
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDelete} disabled={deleting} aria-label="Delete"
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {deleteErr && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{deleteErr}</p>
            )}
          </>
        )}
      </div>

      {/* Start workout button (top) */}
      <StartWorkoutButton routineId={routine.id} routineName={routine.name} />

      {/* Exercises */}
      {exercises.length === 0 ? (
        <div className="shred-card text-center py-6 text-sm text-muted-foreground">
          No exercises yet. Add your first exercise below.
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((re, idx) => (
            <RoutineExerciseRow
              key={re.id}
              re={re}
              isFirst={idx === 0}
              isLast={idx === exercises.length - 1}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
            />
          ))}
        </div>
      )}

      {/* Add exercise picker */}
      {showPicker ? (
        <ExercisePicker
          exercises={allExercises}
          onAdd={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      ) : (
        <button type="button" onClick={() => setShowPicker(true)}
          className="w-full shred-card flex items-center justify-center gap-2 py-3 text-sm text-primary hover:border-primary/50 transition-colors border-dashed">
          <Plus className="w-4 h-4" />
          Add exercise
        </button>
      )}

      {/* Start workout button (bottom) */}
      {exercises.length > 0 && (
        <StartWorkoutButton routineId={routine.id} routineName={routine.name} />
      )}
    </div>
  )
}
