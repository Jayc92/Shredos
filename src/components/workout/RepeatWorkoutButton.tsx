'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repeat } from 'lucide-react'
import { ActiveWorkoutConflictModal } from '@/components/workout/ActiveWorkoutConflictModal'

// ============================================================
// ForgeFitOS — Repeat a completed workout (UI-5B2)
// Rendered ONLY on completed workouts (the caller gates on status).
// POSTs an empty body to the repeat route (which resolves the
// user-local date server-side and calls only the migration 022 RPC),
// then navigates into the new session. An active-workout 409 reuses
// the SAME ActiveWorkoutConflictModal flow as CreateWorkoutButton /
// StartWorkoutButton: Resume routes to the active workout; Discard
// skips it through the existing authorized route and retries exactly
// once — a second conflict is shown, never looped on.
// ============================================================

interface RepeatWorkoutButtonProps {
  workoutId: string
}

type RepeatAttemptResult =
  | { status: 'repeated' }
  | { status: 'conflict'; activeWorkoutId: string }
  | { status: 'error'; message: string }

export function RepeatWorkoutButton({ workoutId }: RepeatWorkoutButtonProps) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [repeating, setRepeating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictId, setConflictId] = useState<string | null>(null)
  const [modalBusy, setModalBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  async function attemptRepeat(): Promise<RepeatAttemptResult> {
    // Deliberately NO body: the server derives the user from the
    // session and the date from the timezone cookie.
    const res = await fetch(`/api/workouts/${workoutId}/repeat`, { method: 'POST' })
    if (res.ok) {
      const { data } = await res.json()
      router.push(`/workouts/${data.session_id}`)
      return { status: 'repeated' }
    }
    const body = await res.json().catch(() => ({}))
    if (res.status === 409 && body.active_workout_id) {
      return { status: 'conflict', activeWorkoutId: body.active_workout_id }
    }
    return { status: 'error', message: body.error ?? 'Could not repeat the workout.' }
  }

  async function handleRepeat() {
    // pendingRef flips synchronously before any await, so a
    // double-click can never start a second request.
    if (pendingRef.current) return
    pendingRef.current = true
    setRepeating(true)
    setError(null)
    try {
      const result = await attemptRepeat()
      if (result.status === 'conflict') {
        setConflictId(result.activeWorkoutId)
      } else if (result.status === 'error') {
        setError(result.message)
      }
      // 'repeated' -> navigation already happened inside attemptRepeat
    } catch {
      setError('Network error — please try again.')
    } finally {
      setRepeating(false)
      pendingRef.current = false
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
    if (!confirm('Discard the existing in-progress workout and repeat this one? The old workout will be marked skipped, but its data will be preserved.')) return

    setModalBusy(true)
    setModalError(null)
    try {
      const skipRes = await fetch(`/api/workouts/${conflictId}/skip`, { method: 'POST' })
      if (!skipRes.ok) {
        setModalError('Could not discard the existing workout. Please try again.')
        return
      }

      // Retry exactly once — if this still conflicts (e.g. another
      // session became active in the meantime), show the updated
      // conflict rather than looping.
      const result = await attemptRepeat()
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
    <>
      <button
        type="button"
        onClick={handleRepeat}
        disabled={repeating}
        className="flex min-h-11 items-center gap-2 rounded-lg border border-edge px-4 text-sm font-medium text-ink hover:border-ink-muted disabled:opacity-50 transition-colors"
      >
        <Repeat className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {repeating ? 'Repeating…' : 'Repeat workout'}
      </button>
      {error && (
        <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1" aria-live="polite">
          {error}
        </p>
      )}
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
