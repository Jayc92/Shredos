'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'

interface StartWorkoutButtonProps {
  routineId: string
  routineName: string
  isActive?: boolean
  className?: string
}

export function StartWorkoutButton({ routineId, routineName, isActive = true, className }: StartWorkoutButtonProps) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [starting, setStarting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  if (!isActive) {
    return (
      <div className={className}>
        <p className="text-xs text-center text-muted-foreground py-2 px-4 rounded-lg border border-border bg-secondary">
          Reactivate this routine to start a workout from it.
        </p>
      </div>
    )
  }

  async function handleStart() {
    if (pendingRef.current) return
    pendingRef.current = true
    setStarting(true); setError(null)
    try {
      const workout_date = new Date().toLocaleDateString('en-CA')
      const res = await fetch(`/api/routines/${routineId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout_date }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not start workout.')
      }
      const { data } = await res.json()
      router.push(`/workouts/${data.session_id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start workout. Try again.'
      setError(msg); setStarting(false); pendingRef.current = false
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
    </div>
  )
}
