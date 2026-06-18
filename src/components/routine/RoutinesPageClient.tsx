'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoutineCard } from './RoutineCard'
import { RoutineForm } from './RoutineForm'
import { Plus, BookOpen } from 'lucide-react'
import type { WorkoutRoutine } from '@/types/database'

interface RoutinesPageClientProps {
  initialRoutines: any[]
}

export function RoutinesPageClient({ initialRoutines }: RoutinesPageClientProps) {
  const router = useRouter()
  const [creating, setCreating]         = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const active   = initialRoutines.filter(r => r.is_active)
  const inactive = initialRoutines.filter(r => !r.is_active)

  function handleCreated(id: string) {
    setCreating(false)
    router.push(`/workouts/routines/${id}`)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Routines
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} saved routine{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Inline create form */}
      {creating && (
        <div className="shred-card">
          <RoutineForm onClose={() => setCreating(false)} onCreated={handleCreated} />
        </div>
      )}

      {/* Active routines */}
      {active.length > 0 ? (
        <div className="space-y-2">
          {active.map((r: any) => <RoutineCard key={r.id} routine={r} />)}
        </div>
      ) : !creating && (
        <div className="shred-card text-center py-10 space-y-3">
          <p className="text-sm text-muted-foreground">No routines yet.</p>
          <p className="text-xs text-muted-foreground">
            Build a reusable Push Day, Pull Day, or Leg Day and start any workout in one tap.
          </p>
          <button onClick={() => setCreating(true)}
            className="text-sm text-primary hover:underline">
            Create your first routine
          </button>
        </div>
      )}

      {/* Inactive section */}
      {inactive.length > 0 && (
        <div>
          <button onClick={() => setShowInactive(!showInactive)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {showInactive ? 'Hide' : 'Show'} inactive routines ({inactive.length})
          </button>
          {showInactive && (
            <div className="space-y-2 mt-2">
              {inactive.map((r: any) => <RoutineCard key={r.id} routine={r} />)}
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <a href="/workouts" className="text-sm text-primary hover:underline">← Back to workouts</a>
      </div>
    </div>
  )
}
