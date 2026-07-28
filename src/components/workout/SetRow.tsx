'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { displayWeight } from '@/lib/workout'
import type { PRType } from '@/lib/workout'
import { Trash2, AlertCircle } from 'lucide-react'
import type { WorkoutSet } from '@/types/database'

// Phase 2C: display labels for evaluateSetPRs' PRType. "Est. 1RM PR"
// specifically, not "1RM PR" -- it's a formula-derived estimate, not a
// verified true 1-rep max. "Rep PR" for bodyweight display copy, while
// the internal type stays bodyweight_reps.
const PR_LABELS: Record<Exclude<PRType, null>, string> = {
  weight: 'Weight PR',
  estimated_1rm: 'Est. 1RM PR',
  bodyweight_reps: 'Rep PR',
}

interface SetRowProps {
  set: WorkoutSet
  isUnilateral: boolean
  prType?: PRType
}

export function SetRow({ set, isUnilateral, prType }: SetRowProps) {
  const router = useRouter()
  const [reps,      setReps]      = useState(set.reps      !== null ? String(set.reps)      : '')
  const [lbs,       setLbs]       = useState(set.weight_kg !== null ? String(displayWeight(set.weight_kg)) : '')
  const [rpe,       setRpe]       = useState(set.rpe       !== null ? String(set.rpe)       : '')
  const [completed, setCompleted] = useState(set.completed)
  const [isWarmup,  setIsWarmup]  = useState(set.is_warmup)
  const [busy,      setBusy]      = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function patch(update: Record<string, unknown>) {
    setSaveError(null)
    const res = await fetch(`/api/workout-sets/${set.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (!res.ok) {
      setSaveError('Not saved')
      return false
    }
    router.refresh()
    return true
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
    const ok = await patch({ completed: next })
    if (!ok) setCompleted(!next)
  }

  async function toggleWarmup() {
    const next = !isWarmup
    setIsWarmup(next)
    const ok = await patch({ is_warmup: next })
    if (!ok) setIsWarmup(!next)
  }

  async function handleDelete() {
    if (!confirm('Delete this set?')) return
    setBusy(true)
    const res = await fetch(`/api/workout-sets/${set.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setSaveError('Delete failed')
      setBusy(false)
      return
    }
    router.refresh()
  }

  const inputCls = 'w-full min-w-0 px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring'
  const weightSuffix = isUnilateral ? 'per side' : 'lbs'

  return (
    <div className={cn(
      'py-2 border-b border-border/40 last:border-0',
      isWarmup   && 'opacity-60',
      completed  && 'opacity-80'
    )}>
      <div className="flex items-center gap-2">
      {/* Set number */}
      <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0 tabular-nums">
        {isWarmup ? 'WU' : set.set_number}
      </span>

      {/* Reps */}
      <div className="flex-1 min-w-0">
        <input type="number" inputMode="numeric" value={reps}
          onChange={e => setReps(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={handleRepsBlur}
          placeholder="reps" min="0" step="1"
          aria-label="Reps"
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
            aria-label={isUnilateral ? 'Weight per side in lbs' : 'Weight in lbs'}
            className={cn(inputCls, isUnilateral ? 'pr-16' : 'pr-7')} />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none pointer-events-none whitespace-nowrap">
            {weightSuffix}
          </span>
        </div>
      </div>

      {/* RPE — Rate of Perceived Exertion 1–10 */}
      <div className="w-12 flex-shrink-0">
        <input type="number" inputMode="decimal" value={rpe}
          onChange={e => setRpe(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={handleRpeBlur}
          placeholder="RPE" min="1" max="10" step="0.5"
          title="Rate of Perceived Exertion (1–10). RPE 10 = max effort. RPE 8 ≈ 2 reps in reserve."
          aria-label="RPE — Rate of Perceived Exertion, 1 to 10"
          className={inputCls} />
      </div>

      {/* Warm-up toggle — WU with tooltip */}
      <button
        type="button"
        onClick={toggleWarmup}
        title="Warm-up set — excluded from progressive overload and volume calculations"
        aria-label="Warm-up set"
        aria-pressed={isWarmup}
        className={cn(
          'text-xs px-1.5 py-0.5 rounded border transition-colors flex-shrink-0 font-medium',
          isWarmup
            ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
            : 'border-border text-muted-foreground hover:border-muted-foreground'
        )}
      >
        WU
      </button>

      {/* Complete */}
      <button
        type="button"
        onClick={toggleComplete}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
          completed
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-border hover:border-muted-foreground'
        )}
      >
        {completed && <span className="text-xs font-bold">✓</span>}
      </button>

      {/* Save error indicator */}
      {saveError && (
        <span title={saveError} className="flex-shrink-0 text-destructive" aria-label={saveError}>
          <AlertCircle className="w-3.5 h-3.5" />
        </span>
      )}

      {/* Delete */}
      <button type="button" onClick={handleDelete} disabled={busy}
        aria-label="Delete set"
        className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 disabled:opacity-40">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      </div>

      {/* Phase 2C: PR badge — only one type shown, priority already
          resolved by evaluateSetPRs before this component ever sees
          prType. SetRow does not query or compute PR status itself. */}
      {prType && (
        <p className="text-xs text-primary font-medium pl-7 mt-1">
          {PR_LABELS[prType]}
        </p>
      )}
    </div>
  )
}
