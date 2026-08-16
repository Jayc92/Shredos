'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RoutineForm } from './RoutineForm'
import { RoutineExerciseRow } from './RoutineExerciseRow'
import { StartWorkoutButton } from './StartWorkoutButton'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { Pencil, EyeOff, Eye, Trash2, Plus, ChevronLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { WorkoutsSubNav } from '@/components/workout/WorkoutsSubNav'
import type { WorkoutRoutineWithExercises, Exercise } from '@/types/database'

interface RoutineDetailClientProps {
  routine: WorkoutRoutineWithExercises
  allExercises: Exercise[]
}

export function RoutineDetailClient({ routine, allExercises }: RoutineDetailClientProps) {
  const router = useRouter()

  // Optimistic exercise list.
  // Initialised from sorted server data; resynced only when exercise count
  // changes (add / remove). Reorder moves update local state immediately
  // and do NOT call router.refresh() — the local state IS the display.
  const [exerciseList, setExerciseList] = useState<any[]>(() =>
    ((routine.workout_routine_exercises ?? []) as any[])
      .slice()
      .sort((a: any, b: any) => a.order_index - b.order_index)
  )
  const exCount = (routine.workout_routine_exercises ?? []).length
  useEffect(() => {
    setExerciseList(
      ((routine.workout_routine_exercises ?? []) as any[])
        .slice()
        .sort((a: any, b: any) => a.order_index - b.order_index)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exCount])

  const [editingMeta,     setEditingMeta]    = useState(false)
  const [showPicker,      setShowPicker]     = useState(false)
  const [reordering,      setReordering]     = useState(false)
  const [reorderErr,      setReorderErr]     = useState<string | null>(null)
  const [addErr,          setAddErr]         = useState<string | null>(null)
  const [toggling,        setToggling]       = useState(false)
  const [toggleErr,       setToggleErr]      = useState<string | null>(null)
  const [deleting,        setDeleting]       = useState(false)
  const [deleteErr,       setDeleteErr]      = useState<string | null>(null)
  const [offerDeactivate, setOfferDeactivate] = useState(false)

  async function handleAddExercise(exerciseId: string) {
    setAddErr(null)
    const res = await fetch(`/api/routines/${routine.id}/exercises`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    if (!res.ok) { setAddErr('Failed to add exercise — please try again.'); return }
    router.refresh()
  }

  // moveExercise: shared helper for handleMoveUp and handleMoveDown.
  // Swaps positions AND order_index values so subsequent moves read
  // correct indexes. UI-5B1B: the optimistic swap stays for
  // responsiveness, but persistence is now ONE call to the
  // transactional exercise-order endpoint (migration 021 RPC) with
  // the complete ordered id list — the server validates the exact
  // membership and commits the whole ordering or nothing, replacing
  // the old two-independent-PATCH sequence whose partial failure
  // could corrupt ordering.
  async function moveExercise(fromIdx: number, toIdx: number) {
    if (reordering) return

    const fromOrderIndex = exerciseList[fromIdx].order_index
    const toOrderIndex   = exerciseList[toIdx].order_index
    const snapshot: any[] = exerciseList.map((e: any) => ({ ...e }))

    const next = exerciseList.map((e: any) => ({ ...e }))
    ;[next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]]
    next[toIdx]   = { ...next[toIdx],   order_index: toOrderIndex }
    next[fromIdx] = { ...next[fromIdx], order_index: fromOrderIndex }
    setExerciseList(next)

    setReordering(true)
    setReorderErr(null)

    const res = await fetch(`/api/routines/${routine.id}/exercise-order`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordered_ids: next.map((e: any) => e.id) }),
    })

    if (!res.ok) {
      setExerciseList(snapshot)
      setReorderErr('Reorder failed — please try again.')
    }
    setReordering(false)
  }

  function handleMoveUp(idx: number)   { if (idx > 0)                       moveExercise(idx, idx - 1) }
  function handleMoveDown(idx: number) { if (idx < exerciseList.length - 1) moveExercise(idx, idx + 1) }

  async function toggleActive() {
    const newActive = !routine.is_active
    const label = newActive ? 'Reactivate' : 'Deactivate'
    if (!confirm(`${label} “${routine.name}”?`)) return
    setToggling(true); setToggleErr(null); setDeleteErr(null); setOfferDeactivate(false)
    const res = await fetch(`/api/routines/${routine.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newActive }),
    })
    if (!res.ok) setToggleErr(`Could not ${label.toLowerCase()} — please try again.`)
    setToggling(false)
    router.refresh()
  }

  async function handleDeactivateInstead() {
    setOfferDeactivate(false); setDeleteErr(null); setToggling(true)
    const res = await fetch(`/api/routines/${routine.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    if (!res.ok) setToggleErr('Could not deactivate — please try again.')
    setToggling(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleteErr(null); setOfferDeactivate(false)
    if (!confirm(`Permanently delete “${routine.name}”? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/routines/${routine.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (res.status === 409 && body.has_sessions) {
        setDeleteErr('This routine has been used in workouts and cannot be deleted.')
        setOfferDeactivate(true)
      } else {
        setDeleteErr(body.error ?? 'Delete failed — please try again.')
      }
      setDeleting(false); return
    }
    router.push('/workouts/routines')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      {/* UI-5A: lucide chevron replaces the text-glyph arrow. */}
      <a href="/workouts/routines"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Routines
      </a>

      <WorkoutsSubNav />

      {/* UI-5A detail grid: routine identity/management on the left,
          the exercise list (the bulk of the content) on the right at
          lg+; single column below. lg:items-start keeps natural
          heights, and forms stay bounded to the left column instead
          of stretching across the widened container. */}
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
      <div className="space-y-4 lg:col-span-5 xl:col-span-4">
      <Card variant="default" className="gap-0 py-4">
        <CardContent className="space-y-3">
        {editingMeta ? (
          <RoutineForm existing={routine} onClose={() => setEditingMeta(false)} />
        ) : (
          <>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-ink">{routine.name}</h1>
                {routine.description && <p className="text-xs text-ink-muted mt-0.5">{routine.description}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {routine.goal && <span className="text-xs rounded-full border border-edge-subtle px-2.5 py-0.5 text-ink-muted">{routine.goal}</span>}
                  {routine.primary_muscle_focus && <span className="text-xs rounded-full border border-edge-subtle px-2.5 py-0.5 text-ink-muted">{routine.primary_muscle_focus.replace('_', ' ')}</span>}
                  {routine.difficulty && <span className="text-xs rounded-full border border-edge-subtle px-2.5 py-0.5 text-ink-muted">{routine.difficulty}</span>}
                  {routine.estimated_duration_minutes && <span className="text-xs text-ink-muted">~{routine.estimated_duration_minutes} min</span>}
                </div>
              </div>
              <button onClick={() => setEditingMeta(true)}
                title="Edit routine details" aria-label="Edit routine details"
                className="p-1.5 text-ink-muted hover:text-ink transition-colors flex-shrink-0">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-edge-subtle/60">
              <button onClick={toggleActive} disabled={toggling}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink border border-edge rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-40">
                {routine.is_active ? <EyeOff className="w-3.5 h-3.5 flex-shrink-0" /> : <Eye className="w-3.5 h-3.5 flex-shrink-0" />}
                {routine.is_active ? 'Deactivate routine' : 'Reactivate routine'}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 text-xs text-critical border border-critical/30 rounded-md px-2.5 py-1.5 hover:bg-critical-subtle transition-colors disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /> Delete permanently
              </button>
            </div>

            {toggleErr && <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1">{toggleErr}</p>}
            {deleteErr && (
              <div className="text-xs bg-critical-subtle rounded px-2 py-2 space-y-1.5">
                <p className="text-critical">{deleteErr}</p>
                {offerDeactivate && (
                  <>
                    <p className="text-ink-muted">Deactivate it instead to hide it while keeping workout history intact.</p>
                    <button onClick={handleDeactivateInstead} className="text-xs font-medium text-brand hover:underline">
                      Deactivate this routine
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>

      {/* Fix 2: single Start button (with the routine identity column) */}
      <StartWorkoutButton routineId={routine.id} routineName={routine.name} isActive={routine.is_active} />
      </div>

      <div className="space-y-4 lg:col-span-7 xl:col-span-8">
      {reorderErr && <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1">{reorderErr}</p>}

      {exerciseList.length === 0 ? (
        <Card variant="status" className="gap-0 py-6">
          <CardContent className="text-center text-sm text-ink-muted">No exercises yet. Add your first exercise below.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exerciseList.map((re: any, idx: number) => (
            <RoutineExerciseRow key={re.id} re={re}
              isFirst={idx === 0} isLast={idx === exerciseList.length - 1}
              isReordering={reordering}
              onMoveUp={() => handleMoveUp(idx)} onMoveDown={() => handleMoveDown(idx)} />
          ))}
        </div>
      )}

      {addErr && <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1">{addErr}</p>}

      {showPicker ? (
        <ExercisePicker exercises={allExercises} onAdd={handleAddExercise}
          onClose={() => { setShowPicker(false); setAddErr(null) }} />
      ) : (
        <button type="button" onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-edge bg-surface py-3 text-sm text-brand hover:border-brand/50 transition-colors min-h-11">
          <Plus className="w-4 h-4" aria-hidden="true" /> Add exercise
        </button>
      )}
      {/* Fix 2: second StartWorkoutButton removed — was duplicating the one above */}
      </div>
      </div>
    </div>
  )
}
