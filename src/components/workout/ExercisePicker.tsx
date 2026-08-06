'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { PRIMARY_MUSCLES } from '@/lib/constants'
import { Check, Search, Plus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Exercise } from '@/types/database'

interface ExercisePickerProps {
  exercises: Exercise[]
  /** Caller owns the API call — picker is context-agnostic */
  onAdd: (exerciseId: string) => Promise<void>
  onClose: () => void
}

export function ExercisePicker({ exercises, onAdd, onClose }: ExercisePickerProps) {
  const [search,  setSearch]  = useState('')
  const [muscle,  setMuscle]  = useState('all')
  const [adding,  setAdding]  = useState<string | null>(null)

  const filtered = useMemo(() => exercises.filter(e =>
    e.is_active &&
    (muscle === 'all' || e.primary_muscle === muscle) &&
    (search === '' || e.name.toLowerCase().includes(search.toLowerCase()))
  ), [exercises, muscle, search])

  async function handleAdd(exerciseId: string) {
    setAdding(exerciseId)
    try {
      await onAdd(exerciseId)
    } finally {
      setAdding(null)
    }
    onClose()
  }

  const pillCls = (selected: boolean) => cn(
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    selected
      ? 'border border-brand bg-surface-selected font-semibold text-ink'
      : 'border border-edge-subtle bg-surface font-medium text-ink-muted hover:text-ink'
  )

  return (
    <Card variant="default" className="mt-2 gap-0 py-4">
      <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Add exercise</p>
        <button onClick={onClose} className="p-1 text-ink-muted hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Muscle filter pills — high-contrast selected state */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by muscle group">
        <button
          type="button"
          aria-pressed={muscle === 'all'}
          onClick={() => setMuscle('all')}
          className={pillCls(muscle === 'all')}
        >
          {muscle === 'all' && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
          All
        </button>
        {PRIMARY_MUSCLES.map(({ value, label }) => {
          const selected = muscle === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setMuscle(value)}
              className={pillCls(selected)}
            >
              {selected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              {label}
            </button>
          )
        })}
      </div>

      {/* Exercise list */}
      <div className="space-y-0.5 max-h-60 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-ink-muted py-3 text-center">No exercises found.</p>
        )}
        {filtered.map(e => (
          <div key={e.id}
            className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-interactive transition-colors">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-ink truncate">{e.name}</p>
              <p className="text-xs text-ink-muted">
                {e.primary_muscle.charAt(0).toUpperCase() + e.primary_muscle.slice(1)}
                {e.equipment ? ` · ${e.equipment}` : ''}
                {e.unilateral ? ' · per side' : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={adding === e.id}
              onClick={() => handleAdd(e.id)}
              className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover disabled:opacity-50 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {adding === e.id ? 'Adding…' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-edge-subtle">
        <a href="/workouts/exercises" className="text-xs text-brand hover:underline">
          Manage exercise library →
        </a>
      </div>
      </CardContent>
    </Card>
  )
}
