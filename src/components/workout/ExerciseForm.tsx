'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
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

// Phase 5A.6B: multi-select pill group for secondary/tertiary muscle
// targets. Muscles claimed by another role arrive in `unavailable`
// and are hidden entirely — a muscle can hold exactly one role, so
// collisions are structurally impossible rather than merely warned
// about, and the visible options stay uncluttered.
type MultiPillGroupProps = {
  options: readonly { value: string; label: string }[]
  selected: string[]
  unavailable: Set<string>
  onToggle: (v: string) => void
}

function MultiPillGroup({ options, selected, unavailable, onToggle }: MultiPillGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options
        .filter(o => !unavailable.has(o.value) || selected.includes(o.value))
        .map(o => (
          <button key={o.value} type="button" onClick={() => onToggle(o.value)}
            aria-pressed={selected.includes(o.value)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
              selected.includes(o.value)
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
  // Phase 5A.6B: prefill secondary/tertiary from the authoritative
  // exercise_muscles join rows (never from the deprecated
  // secondary_muscles JSONB).
  const [secondary, setSecondary] = useState<string[]>(
    existing?.exercise_muscles?.filter(m => m.role === 'secondary').map(m => m.muscle) ?? []
  )
  const [tertiary, setTertiary] = useState<string[]>(
    existing?.exercise_muscles?.filter(m => m.role === 'tertiary').map(m => m.muscle) ?? []
  )
  const [equipment,  setEquipment]  = useState<string>(existing?.equipment ?? '')
  const [trackingMode, setTrackingMode] = useState<string>(existing?.tracking_mode ?? 'weight_reps')
  const [unilateral, setUnilateral] = useState(existing?.unilateral ?? false)
  const [notes,      setNotes]      = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  // Presentation only (physical-QA correction): the two target
  // groups collapse behind disclosure rows so the form stays short —
  // 25 pills per role made it needlessly tall. Both default to
  // COLLAPSED, even when edit-prefilled selections exist (the "N
  // selected" summary surfaces them instead of auto-expanding).
  // Disclosure state never touches the selections: collapsing hides
  // pills, it clears nothing, and the submitted payload is identical
  // regardless of open/closed state.
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [tertiaryOpen,  setTertiaryOpen]  = useState(false)

  // One role per muscle: choosing a primary evicts it from both
  // target lists; a secondary pick is unavailable as tertiary and
  // vice versa.
  function handlePrimaryChange(next: string) {
    setMuscle(next)
    setSecondary(prev => prev.filter(m => m !== next))
    setTertiary(prev => prev.filter(m => m !== next))
  }
  function toggleSecondary(m: string) {
    setSecondary(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }
  function toggleTertiary(m: string) {
    setTertiary(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Exercise name is required.'); return }
    if (!muscle) { setError('Primary muscle is required.'); return }
    setSaving(true)

    const payload = {
      name: name.trim(), category: category || null,
      primary_muscle: muscle,
      // Explicit roles contract (5A.6B, D6): secondary/tertiary only —
      // the primary is its own field and never appears here.
      muscle_targets: [
        ...secondary.map(m => ({ muscle: m, role: 'secondary' as const })),
        ...tertiary.map(m => ({ muscle: m, role: 'tertiary' as const })),
      ],
      equipment: equipment || null,
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

  const secondaryUnavailable = new Set([muscle, ...tertiary])
  const tertiaryUnavailable = new Set([muscle, ...secondary])

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
        <PillGroup options={PRIMARY_MUSCLES} value={muscle as any} onChange={handlePrimaryChange as any} />
      </div>

      <div className="rounded-lg border border-border">
        <button type="button"
          onClick={() => setSecondaryOpen(!secondaryOpen)}
          aria-expanded={secondaryOpen}
          aria-controls="secondary-muscles-panel"
          className="w-full flex items-center justify-between px-3 py-2.5 text-left">
          <span>
            <span className="block text-xs font-medium text-foreground">Secondary muscles</span>
            <span className="block text-xs text-muted-foreground">
              Optional · {secondary.length} selected
            </span>
          </span>
          <ChevronDown aria-hidden="true"
            className={cn('w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform',
              secondaryOpen && 'rotate-180')} />
        </button>
        {secondaryOpen && (
          <div id="secondary-muscles-panel" className="px-3 pb-3">
            <MultiPillGroup options={PRIMARY_MUSCLES} selected={secondary}
              unavailable={secondaryUnavailable} onToggle={toggleSecondary} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <button type="button"
          onClick={() => setTertiaryOpen(!tertiaryOpen)}
          aria-expanded={tertiaryOpen}
          aria-controls="tertiary-muscles-panel"
          className="w-full flex items-center justify-between px-3 py-2.5 text-left">
          <span>
            <span className="block text-xs font-medium text-foreground">Tertiary muscles</span>
            <span className="block text-xs text-muted-foreground">
              Optional · lighter involvement · {tertiary.length} selected
            </span>
          </span>
          <ChevronDown aria-hidden="true"
            className={cn('w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform',
              tertiaryOpen && 'rotate-180')} />
        </button>
        {tertiaryOpen && (
          <div id="tertiary-muscles-panel" className="px-3 pb-3">
            <MultiPillGroup options={PRIMARY_MUSCLES} selected={tertiary}
              unavailable={tertiaryUnavailable} onToggle={toggleTertiary} />
          </div>
        )}
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
