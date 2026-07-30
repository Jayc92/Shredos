'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  EXERCISE_CATEGORIES, EXERCISE_EQUIPMENT, TRACKING_MODES, PRIMARY_MUSCLES,
} from '@/lib/constants'
import type { Exercise } from '@/types/database'

interface ExerciseFormProps {
  existing?: Exercise
  onClose: () => void
}

type PillGroupProps<T extends string> = {
  options: readonly { value: T; label: string }[]
  value: T | ''
  onChange: (v: T) => void
}

function PillGroup<T extends string>({ options, value, onChange }: PillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
            value === o.value
              ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ExerciseForm({ existing, onClose }: ExerciseFormProps) {
  const router = useRouter()
  const [name,       setName]       = useState(existing?.name ?? '')
  const [category,   setCategory]   = useState<string>(existing?.category ?? '')
  const [muscle,     setMuscle]     = useState<string>(existing?.primary_muscle ?? '')
  const [equipment,  setEquipment]  = useState<string>(existing?.equipment ?? '')
  const [trackingMode, setTrackingMode] = useState<string>(existing?.tracking_mode ?? 'weight_reps')
  const [unilateral, setUnilateral] = useState(existing?.unilateral ?? false)
  const [notes,      setNotes]      = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Exercise name is required.'); return }
    if (!muscle) { setError('Primary muscle is required.'); return }
    setSaving(true)

    const payload = {
      name: name.trim(), category: category || null,
      primary_muscle: muscle, equipment: equipment || null,
      tracking_mode: trackingMode || 'weight_reps',
      unilateral, notes: notes.trim() || null,
    }

    const url    = existing ? `/api/exercises/${existing.id}` : '/api/exercises'
    const method = existing ? 'PATCH' : 'POST'
    const res    = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to save.')
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="text-sm font-semibold">
        {existing ? 'Edit exercise' : 'New exercise'}
      </h3>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
        <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Cable chest fly"
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Primary muscle *</label>
        <PillGroup options={PRIMARY_MUSCLES} value={muscle as any} onChange={setMuscle as any} />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
        <PillGroup options={EXERCISE_CATEGORIES} value={category as any} onChange={setCategory as any} />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Equipment</label>
        <PillGroup options={EXERCISE_EQUIPMENT} value={equipment as any} onChange={setEquipment as any} />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tracking method</label>
        <PillGroup options={TRACKING_MODES} value={trackingMode as any} onChange={setTrackingMode as any} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={unilateral}
          onChange={e => setUnilateral(e.target.checked)}
          className="rounded border-border flex-shrink-0" />
        <div>
          <span className="text-sm font-medium text-foreground">Unilateral exercise</span>
          <p className="text-xs text-muted-foreground">Log weight per side (e.g. dumbbell curls)</p>
        </div>
      </label>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes (optional)</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any notes about form or setup"
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose}
          className="py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  )
}
