'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ActiveWorkoutConflictModal } from './ActiveWorkoutConflictModal'

interface CreateWorkoutButtonProps {
  label?: string
}

type CreateAttemptResult =
  | { status: 'created' }
  | { status: 'conflict'; activeWorkoutId: string }
  | { status: 'error' }

export function CreateWorkoutButton({ label = 'New workout' }: CreateWorkoutButtonProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [conflictId, setConflictId] = useState<string | null>(null)
  const [modalBusy, setModalBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  async function attemptCreate(): Promise<CreateAttemptResult> {
    // Use the browser's local date (not UTC) so workout_date matches the user's calendar day
    const workout_date = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local tz
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout_date }),
    })
    if (res.ok) {
      const { data } = await res.json()
      router.push(`/workouts/${data.id}`)
      return { status: 'created' }
    }
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}))
      if (body.active_workout_id) {
        return { status: 'conflict', activeWorkoutId: body.active_workout_id }
      }
    }
    return { status: 'error' }
  }

  async function handleCreate() {
    setCreating(true)
    const result = await attemptCreate()
    if (result.status === 'conflict') {
      setConflictId(result.activeWorkoutId)
    }
    // Non-conflict failure stays silent, same as before Phase 2K —
    // this component never showed a visible error for that case.
    setCreating(false)
  }

  function handleResume() {
    if (!conflictId) return
    router.push(`/workouts/${conflictId}`)
  }

  function handleCancel() {
    setConflictId(null)
    setModalError(null)
  }

  async function handleDiscardAndRetry() {
    if (!conflictId) return
    if (!confirm('Discard the existing in-progress workout and start a new one? The old workout will be marked skipped, but its data will be preserved.')) return

    setModalBusy(true)
    setModalError(null)
    try {
      const patchRes = await fetch(`/api/workouts/${conflictId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped' }),
      })
      if (!patchRes.ok) {
        setModalError('Could not discard the existing workout. Please try again.')
        return
      }

      // Retry exactly once — if this still conflicts (e.g. another
      // session became active in the meantime), show the updated
      // conflict rather than looping.
      const result = await attemptCreate()
      if (result.status === 'conflict') {
        setConflictId(result.activeWorkoutId)
        return
      }
      if (result.status === 'error') {
        setModalError('Could not start a new workout. Please try again.')
        return
      }
      setConflictId(null)
    } catch {
      setModalError('Network error — please try again.')
    } finally {
      setModalBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {creating ? 'Starting…' : label}
      </button>
      {conflictId && (
        <ActiveWorkoutConflictModal
          busy={modalBusy}
          error={modalError}
          onResume={handleResume}
          onDiscardAndRetry={handleDiscardAndRetry}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
