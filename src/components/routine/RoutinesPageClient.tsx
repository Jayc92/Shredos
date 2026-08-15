'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoutineCard } from './RoutineCard'
import { RoutineForm } from './RoutineForm'
import { WorkoutsSubNav } from '@/components/workout/WorkoutsSubNav'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import type { WorkoutRoutine } from '@/types/database'

// UI-5A: routines present as a responsive card grid on wider screens
// (single column on mobile) inside the approved max-w-6xl container.
// All CRUD, start, and empty-state behavior is unchanged.

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
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      <PageHeader
        title="Routines"
        description={`${active.length} saved routine${active.length !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => setCreating(!creating)}
            className="flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" aria-hidden="true" />
            New
          </button>
        }
      />

      <WorkoutsSubNav />

      {/* Inline create form — bounded so desktop widening never
          stretches form controls across the full container. */}
      {creating && (
        <Card variant="elevated" className="gap-0 py-4 max-w-2xl">
          <CardContent>
            <RoutineForm onClose={() => setCreating(false)} onCreated={handleCreated} />
          </CardContent>
        </Card>
      )}

      {/* Active routines */}
      {active.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:items-start">
          {active.map((r: any) => <RoutineCard key={r.id} routine={r} />)}
        </div>
      ) : !creating && (
        <Card variant="status" className="gap-0 py-10">
          <CardContent>
            <EmptyState
              title="No routines yet."
              description="Build a reusable Push Day, Pull Day, or Leg Day and start any workout in one tap."
              action={
                <button onClick={() => setCreating(true)}
                  className="text-sm text-brand hover:underline">
                  Create your first routine
                </button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Inactive section */}
      {inactive.length > 0 && (
        <div>
          <button onClick={() => setShowInactive(!showInactive)}
            className="text-xs text-ink-muted hover:text-ink transition-colors">
            {showInactive ? 'Hide' : 'Show'} inactive routines ({inactive.length})
          </button>
          {showInactive && (
            <div className="grid gap-3 mt-2 sm:grid-cols-2 xl:grid-cols-3 lg:items-start">
              {inactive.map((r: any) => <RoutineCard key={r.id} routine={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
