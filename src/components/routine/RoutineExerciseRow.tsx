'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatRoutineTarget } from '@/lib/routine'
import { displayWeight } from '@/lib/workout'
import { ChevronUp, ChevronDown, Trash2, Pencil, Check, X } from 'lucide-react'
import type { WorkoutRoutineExerciseWithDetails } from '@/types/database'

interface RoutineExerciseRowProps {
  re: WorkoutRoutineExerciseWithDetails
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

export function RoutineExerciseRow({ re, isFirst, isLast, onMoveUp, onMoveDown }: RoutineExerciseRowProps) {
  const router = useRouter()
  const [editing, setEditing]     = useState(false)
  const [removing, setRemoving]   = useState(false)
  const [sets,     setSets]       = useState(re.target_sets?.toString() ?? '')
  const [repsMin,  setRepsMin]    = useState(re.target_reps_min?.toString() ?? '')
  const [repsMax,  setRepsMax]    = useState(re.target_reps_max?.toString() ?? '')
  const [lbs,      setLbs]        = useState(re.target_weight_kg ? displayWeight(re.target_weight_kg)?.toString() ?? '' : '')
  const [rpe,      setRpe]        = useState(re.target_rpe?.toString() ?? '')
  const [rest,     setRest]       = useState(re.rest_seconds?.toString() ?? '')
  const [notes,    setNotes]      = useState(re.notes ?? '')
  const [saveErr,  setSaveErr]    = useState<string | null>(null)

  async function patchTarget(update: Record<string, any>) {
    setSaveErr(null)
    const res = await fetch(`/api/routine-exercises/${re.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (!res.ok) setSaveErr('Not saved')
    else router.refresh()
  }

  function saveAll() {
    const update: Record<string, any> = {
      target_sets: sets ? parseInt(sets) : null,
      target_reps_min: repsMin ? parseInt(repsMin) : null,
      target_reps_max: repsMax ? parseInt(repsMax) : null,
      target_weight_lbs: lbs ? parseFloat(lbs) : null,
      target_rpe: rpe ? parseFloat(rpe) : null,
      rest_seconds: rest ? parseInt(rest) : null,
      notes: notes.trim() || null,
    }
    patchTarget(update)
    setEditing(false)
  }

  async function handleRemove() {
    if (!confirm(`Remove ${re.exercise.name} from this routine?`)) return
    setRemoving(true)
    await fetch(`/api/routine-exercises/${re.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const targetSummary = formatRoutineTarget(re)
  const inputCls = 'w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className="shred-card space-y-2">
      <div className="flex items-center gap-2">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={onMoveUp} disabled={isFirst} aria-label="Move up"
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} aria-label="Move down"
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Exercise name + summary */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{re.exercise.name}</p>
          {targetSummary && !editing && (
            <p className="text-xs text-muted-foreground">{targetSummary}</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!editing ? (
            <button onClick={() => setEditing(true)} aria-label="Edit targets"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button onClick={saveAll} aria-label="Save"
                className="p-1.5 text-green-400 hover:text-green-300 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditing(false)} aria-label="Cancel"
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button onClick={handleRemove} disabled={removing} aria-label="Remove exercise"
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline target editor */}
      {editing && (
        <div className="pl-7 space-y-2 pt-1 border-t border-border/40">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-center">Sets</label>
              <input type="number" inputMode="numeric" value={sets} onChange={e => setSets(e.target.value)}
                onFocus={e => e.target.select()} placeholder="—" min="1" step="1" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-center">Reps min</label>
              <input type="number" inputMode="numeric" value={repsMin} onChange={e => setRepsMin(e.target.value)}
                onFocus={e => e.target.select()} placeholder="—" min="1" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-center">Reps max</label>
              <input type="number" inputMode="numeric" value={repsMax} onChange={e => setRepsMax(e.target.value)}
                onFocus={e => e.target.select()} placeholder="—" min="1" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-center">Weight (lbs)</label>
              <input type="number" inputMode="decimal" value={lbs} onChange={e => setLbs(e.target.value)}
                onFocus={e => e.target.select()} placeholder="—" min="0" step="0.5" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-center">RPE</label>
              <input type="number" inputMode="decimal" value={rpe} onChange={e => setRpe(e.target.value)}
                onFocus={e => e.target.select()} placeholder="—" min="1" max="10" step="0.5" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1 text-center">Rest (s)</label>
              <input type="number" inputMode="numeric" value={rest} onChange={e => setRest(e.target.value)}
                onFocus={e => e.target.select()} placeholder="—" min="0" max="600" step="15" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. supinate at the top"
              className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {saveErr && <p className="text-xs text-destructive">{saveErr}</p>}
        </div>
      )}
    </div>
  )
}
