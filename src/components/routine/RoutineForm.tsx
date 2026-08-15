'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { ROUTINE_GOALS, ROUTINE_MUSCLE_FOCUS, ROUTINE_DIFFICULTIES } from '@/lib/constants'
import type { WorkoutRoutine } from '@/types/database'

interface PillGroupProps { options: readonly { value: string; label: string }[]; value: string; onChange: (v: string) => void }
function PillGroup({ options, value, onChange }: PillGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {options.map(o => {
        const selected = value === o.value
        return (
          <button key={o.value} type="button" aria-pressed={selected} onClick={() => onChange(selected ? '' : o.value)}
            className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors','focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              selected ? 'border-2 border-foreground bg-foreground text-background font-semibold' : 'border border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground')}>
            {selected && <Check className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}{o.label}
          </button>
        )
      })}
    </div>
  )
}

// UI-5A alphabetical refinement: the muscle-focus choices display in
// alphabetical label order via a sorted COPY — the canonical
// registry, stored values, and the submitted payload are untouched.
const FOCUS_BY_LABEL = [...ROUTINE_MUSCLE_FOCUS].sort((a, b) =>
  a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'))

interface RoutineFormProps { existing?: WorkoutRoutine; onClose: () => void; onCreated?: (id: string) => void }
export function RoutineForm({ existing, onClose, onCreated }: RoutineFormProps) {
  const router = useRouter()
  const [name, setName] = useState(existing?.name?.trim() ?? ''); const [desc, setDesc] = useState(existing?.description?.trim() ?? '')
  const [goal, setGoal] = useState(existing?.goal?.trim() ?? ''); const [focus, setFocus] = useState(existing?.primary_muscle_focus?.trim() ?? '')
  const [diff, setDiff] = useState(existing?.difficulty?.trim() ?? ''); const [duration, setDuration] = useState(existing?.estimated_duration_minutes?.toString() ?? '')
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) { setError('Routine name is required.'); return }
    setSaving(true); setError(null)
    const payload = { name: name.trim(), description: desc.trim() || null, goal: goal || null, primary_muscle_focus: focus || null, difficulty: diff || null, estimated_duration_minutes: duration ? parseInt(duration) : null }
    const res = await fetch(existing ? `/api/routines/${existing.id}` : '/api/routines', { method: existing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? 'Failed to save.'); return }
    const { data } = await res.json()
    if (!existing && onCreated) { onCreated(data.id); return }
    router.refresh(); onClose()
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="text-sm font-semibold">{existing ? 'Edit routine' : 'New routine'}</h3>
      <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label><input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Push Day" className={inputCls} /></div>
      <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional notes" className={inputCls} /></div>
      <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Goal</label><PillGroup options={ROUTINE_GOALS} value={goal} onChange={setGoal} /></div>
      <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Primary muscle focus</label><PillGroup options={FOCUS_BY_LABEL} value={focus} onChange={setFocus} /></div>
      <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label><PillGroup options={ROUTINE_DIFFICULTIES} value={diff} onChange={setDiff} /></div>
      <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Estimated duration (minutes)</label><input type="number" inputMode="numeric" value={duration} min="1" step="5" onChange={e => setDuration(e.target.value)} onFocus={e => e.target.select()} placeholder="e.g. 60" className={cn(inputCls, 'w-32')} /></div>
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">{saving ? 'Saving…' : existing ? 'Save changes' : 'Create routine'}</button>
      </div>
    </form>
  )
}
