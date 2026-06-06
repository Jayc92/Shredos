'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PRIMARY_MUSCLES } from '@/lib/constants'
import { ExerciseListItem } from './ExerciseListItem'
import { ExerciseForm } from './ExerciseForm'
import { Search, Plus } from 'lucide-react'
import type { Exercise } from '@/types/database'

interface ExercisesClientProps {
  initialExercises: Exercise[]
}

export function ExercisesClient({ initialExercises }: ExercisesClientProps) {
  const router  = useRouter()
  const [search,     setSearch]    = useState('')
  const [muscle,     setMuscle]    = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [creating, setCreating] = useState(false)

  const exercises = useMemo(() => {
    return initialExercises.filter(e => {
      if (!showInactive && !e.is_active) return false
      if (muscle !== 'all' && e.primary_muscle !== muscle) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [initialExercises, muscle, search, showInactive])

  const active   = exercises.filter(e => e.is_active)
  const inactive = exercises.filter(e => !e.is_active)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Exercise library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {initialExercises.filter(e => e.is_active).length} active exercises
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {creating && (
        <div className="shred-card">
          <ExerciseForm onClose={() => { setCreating(false); router.refresh() }} />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {/* Muscle filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setMuscle('all')}
          className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
            muscle === 'all' ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:bg-muted')}>
          All
        </button>
        {PRIMARY_MUSCLES.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setMuscle(value)}
            className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
              muscle === value ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:bg-muted')}>
            {label}
          </button>
        ))}
      </div>

      {/* Active exercises */}
      <div className="space-y-2">
        {active.map(e => <ExerciseListItem key={e.id} exercise={e} />)}
      </div>

      {/* Inactive toggle */}
      {initialExercises.some(e => !e.is_active) && (
        <button type="button" onClick={() => setShowInactive(!showInactive)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {showInactive ? 'Hide' : 'Show'} inactive exercises
        </button>
      )}

      {showInactive && inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Inactive</p>
          {inactive.map(e => <ExerciseListItem key={e.id} exercise={e} />)}
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <a href="/workouts" className="text-sm text-primary hover:underline">← Back to workouts</a>
      </div>
    </div>
  )
}
