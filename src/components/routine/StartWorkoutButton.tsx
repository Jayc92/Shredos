'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { ActiveWorkoutConflictModal } from '@/components/workout/ActiveWorkoutConflictModal'

interface StartWorkoutButtonProps {
  routineId: string
  routineName: string
  isActive?: boolean
  className?: string
}

type StartAttemptResult =
  | { status: 'started' }
  | { status: 'conflict'; activeWorkoutId: string }
  | { status: 'error'; message: string }

export function StartWorkoutButton({ routineId, routineName, isActive = true, className }: StartWorkoutButtonProps) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [starting, setStarting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [conflictId, setConflictId] = useState<string | null>(null)
  const [modalBusy, setModalBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  if (!isActive) {
    return (
      <div className={className}>
        <p className="text-xs text-center text-muted-foreground py-2 px-4 rounded-lg border border-border bg-secondary">
          Reactivate this routine to start a workout from it.
        </p>
      </div>
    )
  }

  async function attemptStart(): Promise<StartAttemptResult> {
    const workout_date = new Date().toLocaleDateString('en-CA')
    const res = await fetch(`/api/routines/${routineId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout_date }),
    })
    if (res.ok) {
      const { data } = await res.json()
      router.push(`/workouts/${data.session_id}`)
      return { status: 'started' }
    }
    const body = await res.json().catch(() => ({}))
    if (res.status === 409 && body.active_workout_id) {
      return { status: 'conflict', activeWorkoutId: body.active_workout_id }
    }
    return { status: 'error', message: body.error ?? 'Could not start workout.' }
  }

  async function handleStart() {
    if (pendingRef.current) return
    pendingRef.current = true
    setStarting(true); setError(null)
    try {
      const result = await attemptStart()
      if (result.status === 'conflict') {
        setConflictId(result.activeWorkoutId)
      } else if (result.status === 'error') {
        setError(result.message)
      }
      // 'started' -> navigation already happened inside attemptStart
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start workout. Try again.'
      setError(msg)
    } finally {
      setStarting(false); pendingRef.current = false
    }
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
    if (!confirm(`Discard the existing in-progress workout and start ${routineName}? The old workout will be marked skipped, but its data will be preserved.`)) return

    setModalBusy(true)
    setModalError(null)
    try {
      const patchRes = await fetch(`/api/workouts/${conflictId}/skip`, {
        method: 'POST',
      })
      if (!patchRes.ok) {
        setModalError('Could not discard the existing workout. Please try again.')
        return
      }

      // Retry exactly once — if this still conflicts (e.g. another
      // session became active in the meantime), show the updated
      // conflict rather than looping.
      const result = await attemptStart()
      if (result.status === 'conflict') {
        setConflictId(result.activeWorkoutId)
        return
      }
      if (result.status === 'error') {
        setModalError(result.message)
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
    <div className={className}>
      <button type="button" onClick={handleStart} disabled={starting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors w-full justify-center">
        <Play className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {starting ? 'Starting…' : `Start ${routineName}`}
      </button>
      {error && <p className="text-xs text-destructive text-center mt-2">{error}</p>}
      {conflictId && (
        <ActiveWorkoutConflictModal
          busy={modalBusy}
          error={modalError}
          onResume={handleResume}
          onDiscardAndRetry={handleDiscardAndRetry}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
