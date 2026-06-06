'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PRIMARY_MUSCLES } from '@/lib/constants'
import { Search, Plus, X } from 'lucide-react'
import type { Exercise } from '@/types/database'

interface ExercisePickerProps {
  exercises: Exercise[]
  workoutId: string
  onClose: () => void
}

export function ExercisePicker({ exercises, workoutId, onClose }: ExercisePickerProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [muscle, setMuscle]  = useState('all')
  const [adding, setAdding]  = useState<string | null>(null)

  const filtered = useMemo(() => exercises.filter(e =>
    e.is_active &&
    (muscle === 'all' || e.primary_muscle === muscle) &&
    (search === '' || e.name.toLowerCase().includes(search.toLowerCase()))
  ), [exercises, muscle, search])

  async function handleAdd(exerciseId: string) {
    setAdding(exerciseId)
    await fetch(`/api/workouts/${workoutId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    router.refresh()
    onClose()
  }

  return (
    <div className="shred-card space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Add exercise</p>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Muscle filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setMuscle('all')}
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
            muscle === 'all'
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}>
          All
        </button>
        {PRIMARY_MUSCLES.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setMuscle(value)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
              muscle === value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-0.5 max-h-60 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-3 text-center">No exercises found.</p>
        )}
        {filtered.map(e => (
          <div key={e.id}
            className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-secondary transition-colors">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.primary_muscle.charAt(0).toUpperCase() + e.primary_muscle.slice(1)}
                {e.equipment ? ` · ${e.equipment}` : ''}
                {e.unilateral ? ' · per side' : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={adding === e.id}
              onClick={() => handleAdd(e.id)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 flex-shrink-0">
              <Plus className="w-3.5 h-3.5" />
              {adding === e.id ? 'Adding…' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-border">
        <a href="/workouts/exercises" className="text-xs text-primary hover:underline">
          Manage exercise library →
        </a>
      </div>
    </div>
  )
}
