'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { macroCrossCheckWarning } from '@/lib/food'
import type { SavedMeal, MealType } from '@/types/database'

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'lunch',      label: 'Lunch' },
  { value: 'dinner',     label: 'Dinner' },
  { value: 'snack',      label: 'Snack' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'drink',      label: 'Drink' },
]

interface SavedMealFormProps {
  existing?: SavedMeal
  onClose: () => void
}

function NInput({ label, value, onChange, unit, required }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; required?: boolean
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && ' *'}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number" inputMode="decimal" value={value} min="0" step="any"
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {unit && <span className="text-xs text-muted-foreground select-none w-6 flex-shrink-0">{unit}</span>}
      </div>
    </div>
  )
}

export function SavedMealForm({ existing, onClose }: SavedMealFormProps) {
  const router = useRouter()
  const [name, setName] = useState(existing?.name ?? '')
  const [mealType, setMealType] = useState<MealType | ''>(existing?.meal_type_default ?? '')
  const [calories, setCalories] = useState(existing ? String(existing.calories) : '')
  const [protein, setProtein]   = useState(existing ? String(Number(existing.protein_g)) : '')
  const [carbs, setCarbs]       = useState(existing ? String(Number(existing.carbs_g)) : '')
  const [fat, setFat]           = useState(existing ? String(Number(existing.fat_g)) : '')
  const [fiber, setFiber]       = useState(existing?.fiber_g != null ? String(existing.fiber_g) : '')
  const [sugar, setSugar]       = useState(existing?.sugar_g != null ? String(existing.sugar_g) : '')
  const [sodium, setSodium]     = useState(existing?.sodium_mg != null ? String(existing.sodium_mg) : '')
  const [isAutopilot, setIsAutopilot] = useState(existing?.is_autopilot ?? false)
  const [notes, setNotes]       = useState(existing?.notes ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const cal = parseInt(calories) || 0
  const pro = parseFloat(protein) || 0
  const carb = parseFloat(carbs) || 0
  const fatVal = parseFloat(fat) || 0
  const crossCheck = cal > 0 ? macroCrossCheckWarning(cal, pro, carb, fatVal) : null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Meal name is required.'); return }
    if (!calories || cal < 0) { setError('Calories must be 0 or more.'); return }
    setSaving(true)

    const payload = {
      name: name.trim(),
      meal_type_default: mealType || null,
      calories: cal, protein_g: pro, carbs_g: carb, fat_g: fatVal,
      fiber_g: fiber ? parseFloat(fiber) : null,
      sugar_g: sugar ? parseFloat(sugar) : null,
      sodium_mg: sodium ? parseInt(sodium) : null,
      is_autopilot: isAutopilot,
      notes: notes.trim() || null,
    }

    const url = existing ? `/api/saved-meals/${existing.id}` : '/api/saved-meals'
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

    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {existing ? 'Edit saved meal' : 'New saved meal'}
      </h3>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Meal name *</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)} autoFocus required
          placeholder="e.g. Greek yogurt + granola"
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Default meal type — pill group, no dropdown */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Default meal type</label>
        <p className="text-xs text-muted-foreground">Used as the default when quick-adding this meal.</p>
        <div className="flex flex-wrap gap-2">
          {/* "None" option clears the default */}
          <button
            type="button"
            onClick={() => setMealType('' as MealType)}
            aria-pressed={!mealType}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              !mealType
                ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-muted'
            )}
          >
            None
          </button>
          {MEAL_TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMealType(value)}
              aria-pressed={mealType === value}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                mealType === value
                  ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3">
        <NInput label="Calories" value={calories} onChange={setCalories} required />
        <NInput label="Protein" value={protein} onChange={setProtein} unit="g" required />
        <NInput label="Carbs" value={carbs} onChange={setCarbs} unit="g" required />
        <NInput label="Fat" value={fat} onChange={setFat} unit="g" required />
        <NInput label="Fiber" value={fiber} onChange={setFiber} unit="g" />
        <NInput label="Sugar" value={sugar} onChange={setSugar} unit="g" />
        <div className="col-span-2">
          <NInput label="Sodium" value={sodium} onChange={setSodium} unit="mg" />
        </div>
      </div>

      {crossCheck && (
        <p className="text-xs text-amber-400 bg-amber-400/10 rounded px-3 py-2">{crossCheck}</p>
      )}

      {/* Autopilot */}
      <div className="space-y-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox" checked={isAutopilot}
            onChange={e => setIsAutopilot(e.target.checked)}
            className="rounded border-border"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Autopilot meal</span>
            <p className="text-xs text-muted-foreground">Appears at the top of Quick Add on the food log page.</p>
          </div>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes (optional)</label>
        <input
          type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any notes about this meal"
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Create meal'}
        </button>
      </div>
    </form>
  )
}
