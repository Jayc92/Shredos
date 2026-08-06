'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatRoutineTarget } from '@/lib/routine'
import { displayWeight } from '@/lib/workout'
import { lbsToKg } from '@/lib/units'
import { ChevronUp, ChevronDown, Trash2, Pencil, Check, X, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { WorkoutRoutineExerciseWithDetails } from '@/types/database'

interface RoutineExerciseRowProps {
  re: WorkoutRoutineExerciseWithDetails
  isFirst: boolean; isLast: boolean; isReordering?: boolean
  onMoveUp: () => void; onMoveDown: () => void
}

export function RoutineExerciseRow({ re, isFirst, isLast, isReordering = false, onMoveUp, onMoveDown }: RoutineExerciseRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false); const [removing, setRemoving] = useState(false)
  const [sets, setSets] = useState(re.target_sets?.toString() ?? '')
  const [repsMin, setRepsMin] = useState(re.target_reps_min?.toString() ?? '')
  const [repsMax, setRepsMax] = useState(re.target_reps_max?.toString() ?? '')
  const [lbs, setLbs] = useState(re.target_weight_kg ? (displayWeight(re.target_weight_kg)?.toString() ?? '') : '')
  const [rpe, setRpe] = useState(re.target_rpe?.toString() ?? ''); const [rest, setRest] = useState(re.rest_seconds?.toString() ?? '')
  const [notes, setNotes] = useState(re.notes ?? '')
  const [snapshot, setSnapshot] = useState({ target_sets: re.target_sets, target_reps_min: re.target_reps_min, target_reps_max: re.target_reps_max, target_weight_kg: re.target_weight_kg, target_rpe: re.target_rpe, rest_seconds: re.rest_seconds, notes: re.notes })
  const [validErr, setValidErr] = useState<string | null>(null); const [saveErr, setSaveErr] = useState<string | null>(null)

  function validate(): string | null {
    const min = repsMin ? parseInt(repsMin) : null; const max = repsMax ? parseInt(repsMax) : null
    if (min !== null && max !== null && min > max) return `Min reps (${min}) can’t exceed max reps (${max}).`
    const rv = rest ? parseInt(rest) : null
    if (rv !== null && (rv < 0 || rv > 3600)) return 'Rest must be between 0 and 3600 seconds.'
    return null
  }

  async function saveAll() {
    const err = validate(); if (err) { setValidErr(err); return }
    setValidErr(null); setSaveErr(null); setSaving(true)
    const savedWeightKg = lbs ? Math.round(lbsToKg(parseFloat(lbs)) * 100) / 100 : null
    try {
      const res = await fetch(`/api/routine-exercises/${re.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_sets: sets ? parseInt(sets) : null, target_reps_min: repsMin ? parseInt(repsMin) : null, target_reps_max: repsMax ? parseInt(repsMax) : null, target_weight_lbs: lbs ? parseFloat(lbs) : null, target_rpe: rpe ? parseFloat(rpe) : null, rest_seconds: rest ? parseInt(rest) : null, notes: notes.trim() || null }),
      })
      if (!res.ok) { const b = await res.json().catch(() => ({})); setSaveErr(b.error ?? 'Failed to save — please try again.'); setSaving(false); return }
      setSnapshot({ target_sets: sets ? parseInt(sets) : null, target_reps_min: repsMin ? parseInt(repsMin) : null, target_reps_max: repsMax ? parseInt(repsMax) : null, target_weight_kg: savedWeightKg, target_rpe: rpe ? parseFloat(rpe) : null, rest_seconds: rest ? parseInt(rest) : null, notes: notes.trim() || null })
      setSaving(false); setEditing(false)
    } catch { setSaveErr('Network error — please try again.'); setSaving(false) }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${re.exercise.name} from this routine?`)) return
    setRemoving(true)
    try { await fetch(`/api/routine-exercises/${re.id}`, { method: 'DELETE' }); router.refresh() } catch { setRemoving(false) }
  }

  const displayRe = { ...re, ...snapshot }; const targetSummary = formatRoutineTarget(displayRe as any)
  const inputCls = 'w-full px-2 py-1.5 rounded-md bg-background border border-input text-ink text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={onMoveUp} disabled={isFirst || isReordering} title="Move exercise up" aria-label="Move exercise up"
            className={cn('p-1.5 rounded transition-colors', isFirst || isReordering ? 'text-edge cursor-not-allowed' : 'text-ink-muted hover:text-ink hover:bg-surface-interactive active:bg-surface-interactive')}>
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={onMoveDown} disabled={isLast || isReordering} title="Move exercise down" aria-label="Move exercise down"
            className={cn('p-1.5 rounded transition-colors', isLast || isReordering ? 'text-edge cursor-not-allowed' : 'text-ink-muted hover:text-ink hover:bg-surface-interactive active:bg-surface-interactive')}>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-ink truncate">{re.exercise.name}</p>
            {!re.exercise.is_active && <span className="inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5 border bg-caution-subtle text-caution border-caution/25"><AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />Inactive exercise</span>}
            {isReordering && <Loader2 className="w-3 h-3 text-ink-muted animate-spin flex-shrink-0" aria-hidden="true" />}
          </div>
          {!editing && targetSummary && <p className="text-xs text-ink-muted">{targetSummary}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!editing ? (
            <button onClick={() => { setSaveErr(null); setValidErr(null); setEditing(true) }} aria-label="Edit targets" className="p-1.5 text-ink-muted hover:text-ink transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          ) : (
            <>
              <button onClick={saveAll} disabled={saving} aria-label={saving ? 'Saving…' : 'Save'} className="p-1.5 text-success hover:text-success/80 disabled:opacity-40 transition-colors">
                {saving ? <span className="text-xs leading-none">…</span> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setEditing(false); setSaveErr(null); setValidErr(null) }} aria-label="Cancel" className="p-1.5 text-ink-muted hover:text-ink transition-colors"><X className="w-3.5 h-3.5" /></button>
            </>
          )}
          <button onClick={handleRemove} disabled={removing} aria-label="Remove exercise from routine" className="p-1.5 text-ink-muted hover:text-critical transition-colors disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {editing && (
        <div className="pl-10 space-y-2 pt-1 border-t border-edge-subtle/60">
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-xs text-ink-muted mb-1 text-center">Sets</label><input type="number" inputMode="numeric" value={sets} onChange={e => setSets(e.target.value)} onFocus={e => e.target.select()} placeholder="—" min="1" step="1" className={inputCls} /></div>
            <div><label className="block text-xs text-ink-muted mb-1 text-center">Reps min</label><input type="number" inputMode="numeric" value={repsMin} onChange={e => { setRepsMin(e.target.value); setValidErr(null) }} onFocus={e => e.target.select()} placeholder="—" min="1" className={inputCls} /></div>
            <div><label className="block text-xs text-ink-muted mb-1 text-center">Reps max</label><input type="number" inputMode="numeric" value={repsMax} onChange={e => { setRepsMax(e.target.value); setValidErr(null) }} onFocus={e => e.target.select()} placeholder="—" min="1" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-xs text-ink-muted mb-1 text-center">Weight (lbs)</label><input type="number" inputMode="decimal" value={lbs} onChange={e => setLbs(e.target.value)} onFocus={e => e.target.select()} placeholder="—" min="0" step="0.5" className={inputCls} /></div>
            <div><label className="block text-xs text-ink-muted mb-1 text-center">RPE</label><input type="number" inputMode="decimal" value={rpe} onChange={e => setRpe(e.target.value)} onFocus={e => e.target.select()} placeholder="—" min="1" max="10" step="0.5" className={inputCls} /></div>
            <div><label className="block text-xs text-ink-muted mb-1 text-center">Rest (s)</label><input type="number" inputMode="numeric" value={rest} onChange={e => { setRest(e.target.value); setValidErr(null) }} onFocus={e => e.target.select()} placeholder="—" min="0" max="3600" step="15" className={inputCls} /></div>
          </div>
          <div><label className="block text-xs text-ink-muted mb-1">Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. supinate at the top" className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-ink placeholder:text-ink-muted text-xs focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          {validErr && <p className="flex items-center gap-1 text-xs text-caution"><AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />{validErr}</p>}
          {saveErr && <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1">{saveErr}</p>}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
