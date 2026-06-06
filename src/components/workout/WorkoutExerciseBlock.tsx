'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { bestSet, progressSignal, formatPreviousBest } from '@/lib/workout'
import { displayWeight } from '@/lib/workout'
import { lbsToKg } from '@/lib/units'
import { ProgressBadge } from './ProgressBadge'
import { SetRow } from './SetRow'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { WorkoutExerciseWithDetails, WorkoutSet } from '@/types/database'

interface WorkoutExerciseBlockProps {
  we: WorkoutExerciseWithDetails
  previousBest: WorkoutSet | null
}

export function WorkoutExerciseBlock({ we, previousBest }: WorkoutExerciseBlockProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(true)
  const [addingSet, setAddingSet] = useState(false)
  const [removing, setRemoving]   = useState(false)

  const sets    = we.workout_sets ?? []
  const curBest = bestSet(sets)
  const signal  = progressSignal(curBest, previousBest)
  const prevSummary = formatPreviousBest(previousBest)

  const completedSets = sets.filter(s => s.completed && !s.is_warmup).length
  const totalSets     = sets.filter(s => !s.is_warmup).length

  async function handleAddSet() {
    setAddingSet(true)
    // Pre-fill from last set in this exercise
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null
    await fetch(`/api/workout-exercises/${we.id}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_lbs: lastSet?.weight_kg ? displayWeight(lastSet.weight_kg) : null,
        reps: lastSet?.reps ?? null,
        is_warmup: false,
        completed: false,
      }),
    })
    setAddingSet(false)
    router.refresh()
  }

  async function handleRemove() {
    if (!confirm(`Remove ${we.exercise.name} from this workout?`)) return
    setRemoving(true)
    await fetch(`/api/workout-exercises/${we.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="shred-card space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="flex items-start gap-2 flex-1 text-left min-w-0">
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{we.exercise.name}</span>
              {we.exercise.unilateral && (
                <span className="text-xs text-muted-foreground">(per side)</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {we.exercise.primary_muscle.charAt(0).toUpperCase() + we.exercise.primary_muscle.slice(1)}
              {we.exercise.equipment ? ` · ${we.exercise.equipment}` : ''}
              {totalSets > 0 && ` · ${completedSets}/${totalSets} sets done`}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ProgressBadge signal={signal} previousSummary={prevSummary} />
          <button type="button" onClick={handleRemove} disabled={removing}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
            aria-label="Remove exercise">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target info */}
      {open && (we.target_sets || we.target_reps) && (
        <p className="text-xs text-muted-foreground pl-6">
          Target: {[
            we.target_sets && `${we.target_sets} sets`,
            we.target_reps && `${we.target_reps} reps`,
            we.target_weight_kg && `${displayWeight(we.target_weight_kg)} lbs`,
          ].filter(Boolean).join(' × ')}
        </p>
      )}

      {/* Sets */}
      {open && sets.length > 0 && (
        <div className="pl-6">
          {/* Column headers */}
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
            <span className="w-5 text-center">#</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="flex-1 text-center">Weight</span>
            <span className="w-12 text-center">RPE</span>
            <span className="w-6"></span>
            <span className="w-7"></span>
            <span className="w-6"></span>
          </div>
          {sets.map(s => (
            <SetRow key={s.id} set={s} isUnilateral={we.exercise.unilateral} />
          ))}
        </div>
      )}

      {/* Add set */}
      {open && (
        <div className="pl-6">
          <button type="button" onClick={handleAddSet} disabled={addingSet}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {addingSet ? 'Adding…' : 'Add set'}
          </button>
        </div>
      )}
    </div>
  )
}
