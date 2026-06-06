'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ExerciseForm } from './ExerciseForm'
import { Pencil, EyeOff } from 'lucide-react'
import type { Exercise } from '@/types/database'

interface ExerciseListItemProps {
  exercise: Exercise
}

export function ExerciseListItem({ exercise: ex }: ExerciseListItemProps) {
  const router  = useRouter()
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)

  const muscleLabel = ex.primary_muscle.charAt(0).toUpperCase() + ex.primary_muscle.slice(1).replace('_', ' ')

  async function toggleActive() {
    if (!ex.is_active) return // no re-activation in Phase 1C
    if (!confirm(`Deactivate "${ex.name}"? It will be hidden from the exercise picker but history is preserved.`)) return
    setToggling(true)
    await fetch(`/api/exercises/${ex.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    router.refresh()
  }

  if (editing) {
    return (
      <div className="shred-card">
        <ExerciseForm existing={ex} onClose={() => { setEditing(false); router.refresh() }} />
      </div>
    )
  }

  return (
    <div className={cn('shred-card', !ex.is_active && 'opacity-50')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{ex.name}</span>
            {ex.is_system && (
              <span className="text-xs bg-secondary text-muted-foreground rounded px-1.5 py-0.5">Default</span>
            )}
            {!ex.is_active && (
              <span className="text-xs bg-secondary text-muted-foreground rounded px-1.5 py-0.5">Inactive</span>
            )}
            {ex.unilateral && (
              <span className="text-xs text-muted-foreground">per side</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {muscleLabel}
            {ex.equipment ? ` · ${ex.equipment}` : ''}
            {ex.category ? ` · ${ex.category}` : ''}
          </p>
        </div>
        {ex.is_active && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditing(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleActive} disabled={toggling}
              className="p-1.5 text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-40" aria-label="Deactivate">
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
