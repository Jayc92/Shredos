'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'

interface StartWorkoutButtonProps {
  routineId: string
  routineName: string
  className?: string
}

export function StartWorkoutButton({ routineId, routineName, className }: StartWorkoutButtonProps) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setStarting(true)
    setError(null)
    try {
      const workout_date = new Date().toLocaleDateString('en-CA')
      const res = await fetch(`/api/routines/${routineId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout_date }),
      })
      if (!res.ok) throw new Error('Failed to start workout')
      const { data } = await res.json()
      router.push(`/workouts/${data.session_id}`)
    } catch {
      setError('Could not start workout. Try again.')
      setStarting(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleStart}
        disabled={starting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors w-full justify-center"
      >
        <Play className="w-4 h-4 flex-shrink-0" />
        {starting ? 'Starting…' : `Start ${routineName}`}
      </button>
      {error && <p className="text-xs text-destructive text-center mt-2">{error}</p>}
    </div>
  )
}
