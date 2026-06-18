'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUTINE_GOALS, ROUTINE_MUSCLE_FOCUS, ROUTINE_DIFFICULTIES } from '@/lib/constants'
import type { WorkoutRoutine } from '@/types/database'

function PillGroup<T extends string>({
  options, value, onChange,
}: { options: readonly { value: T; label: string }[]; value: T | ''; onChange: (v: T | '') => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o.value} type="button"
          onClick={() => onChange(value === o.value ? '' : o.value)}
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
            value === o.value
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface RoutineFormProps {
  existing?: WorkoutRoutine
  onClose: () => void
  onCreated?: (id: string) => void
}

export function RoutineForm({ existing, onClose, onCreated }: RoutineFormProps) {
  const router = useRouter()
  const [name,     setName]     = useState(existing?.name ?? '')
  const [desc,     setDesc]     = useState(existing?.description ?? '')
  const [goal,     setGoal]     = useState<string>(existing?.goal ?? '')
  const [focus,    setFocus]    = useState<string>(existing?.primary_muscle_focus ?? '')
  const [diff,     setDiff]     = useState<string>(existing?.difficulty ?? '')
  const [duration, setDuration] = useState(existing?.estimated_duration_minutes?.toString() ?? '')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Routine name is required.'); return }
    setSaving(true); setError(null)
    const payload = {
      name: name.trim(),
      description: desc.trim() || null,
      goal: goal || null,
      primary_muscle_focus: focus || null,
      difficulty: diff || null,
      estimated_duration_minutes: duration ? parseInt(duration) : null,
    }
    const url = existing ? `/api/routines/${existing.id}` : '/api/routines'
    const method = existing ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to save.')
      return
    }
    const { data } = await res.json()
    if (!existing && onCreated) { onCreated(data.id); return }
    router.refresh()
    onClose()
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="text-sm font-semibold">{existing ? 'Edit routine' : 'New routine'}</h3>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
        <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Push Day" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Optional notes about this routine" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Goal</label>
        <PillGroup options={ROUTINE_GOALS} value={goal as any} onChange={setGoal as any} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Primary muscle focus</label>
        <PillGroup options={ROUTINE_MUSCLE_FOCUS} value={focus as any} onChange={setFocus as any} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label>
        <PillGroup options={ROUTINE_DIFFICULTIES} value={diff as any} onChange={setDiff as any} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Estimated duration (minutes)</label>
        <input type="number" inputMode="numeric" value={duration} min="1" step="5"
          onChange={e => setDuration(e.target.value)}
          onFocus={e => e.target.select()}
          placeholder="e.g. 60" className={cn(inputCls, 'w-32')} />
      </div>
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose}
          className="py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Create routine'}
        </button>
      </div>
    </form>
  )
}
