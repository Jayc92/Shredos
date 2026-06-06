'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { displayWeight } from '@/lib/workout'
import { lbsToKg } from '@/lib/units'
import { Trash2 } from 'lucide-react'
import type { WorkoutSet } from '@/types/database'

interface SetRowProps {
  set: WorkoutSet
  isUnilateral: boolean
}

export function SetRow({ set, isUnilateral }: SetRowProps) {
  const router = useRouter()
  const [reps, setReps]     = useState(set.reps !== null ? String(set.reps) : '')
  const [lbs, setLbs]       = useState(set.weight_kg !== null ? String(displayWeight(set.weight_kg)) : '')
  const [rpe, setRpe]       = useState(set.rpe !== null ? String(set.rpe) : '')
  const [completed, setCompleted] = useState(set.completed)
  const [isWarmup, setIsWarmup]   = useState(set.is_warmup)
  const [busy, setBusy]     = useState(false)

  async function patch(update: Record<string, unknown>) {
    await fetch(`/api/workout-sets/${set.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    router.refresh()
  }

  async function handleRepsBlur() {
    const n = parseInt(reps)
    if (!isNaN(n) && n !== set.reps) await patch({ reps: n })
  }

  async function handleWeightBlur() {
    const n = parseFloat(lbs)
    if (!isNaN(n)) {
      const stored = set.weight_kg !== null ? displayWeight(set.weight_kg) : null
      if (n !== stored) await patch({ weight_lbs: n })
    }
  }

  async function handleRpeBlur() {
    const n = parseFloat(rpe)
    if (!isNaN(n) && n >= 1 && n <= 10 && n !== set.rpe) await patch({ rpe: n })
  }

  async function toggleComplete() {
    const next = !completed
    setCompleted(next)
    await patch({ completed: next })
  }

  async function toggleWarmup() {
    const next = !isWarmup
    setIsWarmup(next)
    await patch({ is_warmup: next })
  }

  async function handleDelete() {
    if (!confirm('Delete this set?')) return
    setBusy(true)
    await fetch(`/api/workout-sets/${set.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const inputCls = 'w-full min-w-0 px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className={cn(
      'flex items-center gap-2 py-2 border-b border-border/40 last:border-0',
      isWarmup && 'opacity-60',
      completed && 'opacity-80'
    )}>
      {/* Set number */}
      <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0 tabular-nums">
        {isWarmup ? 'W' : set.set_number}
      </span>

      {/* Reps */}
      <div className="flex-1 min-w-0">
        <input type="number" inputMode="numeric" value={reps}
          onChange={e => setReps(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={handleRepsBlur}
          placeholder="reps" min="0" step="1"
          className={inputCls} />
      </div>

      {/* Weight */}
      <div className="flex-1 min-w-0">
        <div className="relative">
          <input type="number" inputMode="decimal" value={lbs}
            onChange={e => setLbs(e.target.value)}
            onFocus={e => e.target.select()}
            onBlur={handleWeightBlur}
            placeholder="0" min="0" step="0.5"
            className={inputCls + ' pr-6'} />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none pointer-events-none">
            {isUnilateral ? 'lbs/s' : 'lbs'}
          </span>
        </div>
      </div>

      {/* RPE */}
      <div className="w-12 flex-shrink-0">
        <input type="number" inputMode="decimal" value={rpe}
          onChange={e => setRpe(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={handleRpeBlur}
          placeholder="RPE" min="1" max="10" step="0.5"
          className={inputCls} />
      </div>

      {/* Warmup pill */}
      <button type="button" onClick={toggleWarmup}
        className={cn(
          'text-xs px-1.5 py-0.5 rounded border transition-colors flex-shrink-0',
          isWarmup
            ? 'border-foreground bg-foreground text-background'
            : 'border-border text-muted-foreground hover:border-muted-foreground'
        )}>
        W
      </button>

      {/* Complete */}
      <button type="button" onClick={toggleComplete}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
          completed
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-border hover:border-muted-foreground'
        )}>
        {completed && <span className="text-xs font-bold">✓</span>}
      </button>

      {/* Delete */}
      <button type="button" onClick={handleDelete} disabled={busy}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 disabled:opacity-40"
        aria-label="Delete set">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
