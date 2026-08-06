'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PRIMARY_MUSCLES } from '@/lib/constants'
import { ExerciseListItem } from './ExerciseListItem'
import { ExerciseForm } from './ExerciseForm'
import { WorkoutsSubNav } from '@/components/workout/WorkoutsSubNav'
import { Check, Search, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Exercise } from '@/types/database'

interface ExercisesClientProps { initialExercises: Exercise[] }

export function ExercisesClient({ initialExercises }: ExercisesClientProps) {
  const router = useRouter()
  const [search,       setSearch]      = useState('')
  const [muscle,       setMuscle]      = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [creating,     setCreating]    = useState(false)

  const filtered = useMemo(() => initialExercises.filter(e => {
    if (!showInactive && !e.is_active) return false
    if (muscle !== 'all' && e.primary_muscle !== muscle) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [initialExercises, muscle, search, showInactive])

  const active   = filtered.filter(e => e.is_active)
  const inactive = filtered.filter(e => !e.is_active)

  const pillCls = (selected: boolean) => cn(
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    selected
      ? 'border border-brand bg-surface-selected font-semibold text-ink'
      : 'border border-edge-subtle bg-surface font-medium text-ink-muted hover:text-ink'
  )

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Exercise library</h1>
          <p className="text-sm text-ink-muted mt-0.5">{initialExercises.filter(e => e.is_active).length} active exercises</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" aria-hidden="true" /> New
        </button>
      </div>

      <WorkoutsSubNav />

      {creating && (
        <Card variant="elevated" className="gap-0 py-4">
          <CardContent>
            <ExerciseForm onClose={() => { setCreating(false); router.refresh() }} />
          </CardContent>
        </Card>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by muscle group">
        <button type="button" aria-pressed={muscle === 'all'} onClick={() => setMuscle('all')} className={pillCls(muscle === 'all')}>
          {muscle === 'all' && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}All
        </button>
        {PRIMARY_MUSCLES.map(({ value, label }) => {
          const selected = muscle === value
          return (
            <button key={value} type="button" aria-pressed={selected} onClick={() => setMuscle(value)} className={pillCls(selected)}>
              {selected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}{label}
            </button>
          )
        })}
      </div>
      {active.length > 0 && <div className="space-y-2">{active.map(e => <ExerciseListItem key={e.id} exercise={e} />)}</div>}
      {active.length === 0 && !creating && (
        <p className="text-sm text-ink-muted text-center py-6">
          {search || muscle !== 'all' ? 'No exercises match this filter.' : 'No exercises yet.'}
        </p>
      )}
      {initialExercises.some(e => !e.is_active) && (
        <button type="button" onClick={() => setShowInactive(p => !p)}
          className="text-xs text-ink-muted hover:text-ink transition-colors">
          {showInactive ? 'Hide' : 'Show'} inactive exercises
        </button>
      )}
      {showInactive && inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-muted">Inactive</p>
          {inactive.map(e => <ExerciseListItem key={e.id} exercise={e} />)}
        </div>
      )}
    </div>
  )
}
