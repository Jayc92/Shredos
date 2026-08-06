'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ExerciseForm } from './ExerciseForm'
import { Pencil, EyeOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
    if (!confirm(`Deactivate "${ex.name}"? It will be hidden from the exercise picker. You can reactivate it later.`)) return
    setToggling(true)
    await fetch(`/api/exercises/${ex.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    router.refresh()
    setToggling(false)
  }

  async function reactivate() {
    if (!confirm(`Reactivate "${ex.name}"? It will reappear in the exercise picker.`)) return
    setToggling(true)
    await fetch(`/api/exercises/${ex.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    })
    router.refresh()
    setToggling(false)
  }

  if (editing) {
    return (
      <Card variant="elevated" className="gap-0 py-4">
        <CardContent>
          <ExerciseForm existing={ex} onClose={() => { setEditing(false); router.refresh() }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="default" className={cn('gap-0 py-4', !ex.is_active && 'opacity-50')}>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">{ex.name}</span>
            {ex.is_system && (
              <span className="text-xs bg-surface-sunken text-ink-muted rounded px-1.5 py-0.5">Default</span>
            )}
            {!ex.is_active && (
              <span className="text-xs bg-surface-sunken text-ink-muted rounded px-1.5 py-0.5">Inactive</span>
            )}
            {ex.unilateral && (
              <span className="text-xs text-ink-muted">per side</span>
            )}
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            {muscleLabel}
            {ex.equipment ? ` · ${ex.equipment}` : ''}
            {ex.category ? ` · ${ex.category}` : ''}
          </p>
        </div>
        {ex.is_active ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditing(true)}
              className="p-1.5 text-ink-muted hover:text-ink transition-colors" aria-label="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleActive} disabled={toggling}
              className="p-1.5 text-ink-muted hover:text-caution transition-colors disabled:opacity-40" aria-label="Deactivate">
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={reactivate} disabled={toggling}
            className="text-xs text-brand hover:underline disabled:opacity-40 flex-shrink-0 transition-colors">
            {toggling ? 'Saving…' : 'Reactivate'}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
