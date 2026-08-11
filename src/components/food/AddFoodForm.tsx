'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { macroCrossCheckWarning } from '@/lib/food'
import type { MealType } from '@/types/database'

interface AddFoodFormProps {
  date: string
  defaultMealType?: MealType
  onClose: () => void
}

const EMPTY = {
  food_name: '', serving_description: '', meal_type: 'snack' as MealType,
  calories: '', protein: '', carbs: '', fat: '',
  fiber: '', sugar: '', sodium: '', notes: '',
  saveAsMeal: false, mealName: '', isAutopilot: false,
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'lunch',      label: 'Lunch' },
  { value: 'dinner',     label: 'Dinner' },
  { value: 'snack',      label: 'Snack' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'drink',      label: 'Drink' },
]

function NInput({ value, onChange, placeholder = '0', unit }: {
  value: string; onChange: (v: string) => void; placeholder?: string; unit?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={e => e.target.select()}
        placeholder={placeholder}
        min="0"
        step="any"
        className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {unit && (
        <span className="text-xs text-muted-foreground select-none flex-shrink-0">{unit}</span>
      )}
    </div>
  )
}

function MacroField({ label, value, onChange, unit }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-1 truncate">{label}</p>
      <NInput value={value} onChange={onChange} unit={unit} />
    </div>
  )
}

export function AddFoodForm({ date, defaultMealType, onClose }: AddFoodFormProps) {
  const router = useRouter()
  const [f, setF] = useState({ ...EMPTY, meal_type: defaultMealType ?? 'snack' as MealType })
  const [showMore, setShowMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upd = (patch: Partial<typeof EMPTY>) => setF(prev => ({ ...prev, ...patch }))

  const cal  = parseInt(f.calories) || 0
  const pro  = parseFloat(f.protein) || 0
  const carb = parseFloat(f.carbs) || 0
  const fat  = parseFloat(f.fat) || 0

  const crossCheck     = cal > 0 ? macroCrossCheckWarning(cal, pro, carb, fat) : null
  const highCalWarning = cal > 2000
    ? `This seems high for a single item (${cal} cal). Confirm the value is correct.`
    : null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!f.food_name.trim()) { setError('Food name is required.'); return }
    if (f.calories === '' || cal < 0) { setError('Calories must be 0 or more.'); return }

    setSaving(true)

    const logRes = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logged_date:         date,
        meal_type:           f.meal_type,
        food_name:           f.food_name.trim(),
        serving_description: f.serving_description.trim() || null,
        calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat,
        fiber_g:   f.fiber  ? parseFloat(f.fiber)  : null,
        sugar_g:   f.sugar  ? parseFloat(f.sugar)  : null,
        sodium_mg: f.sodium ? parseInt(f.sodium)   : null,
        notes:     f.notes.trim() || null,
      }),
    })

    if (!logRes.ok) {
      const body = await logRes.json().catch(() => ({}))
      setError(body.error ?? 'Failed to save entry.')
      setSaving(false)
      return
    }

    if (f.saveAsMeal && f.mealName.trim()) {
      await fetch('/api/saved-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:              f.mealName.trim(),
          meal_type_default: f.meal_type,
          calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat,
          fiber_g:   f.fiber  ? parseFloat(f.fiber)  : null,
          sugar_g:   f.sugar  ? parseFloat(f.sugar)  : null,
          sodium_mg: f.sodium ? parseInt(f.sodium)   : null,
          is_autopilot: f.isAutopilot,
        }),
      })
    }

    setSaving(false)
    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="bg-secondary rounded-xl border border-border p-4 space-y-3 mt-2">

      {/* Food name — full width */}
      <input
        type="text"
        value={f.food_name}
        onChange={e => upd({ food_name: e.target.value })}
        placeholder="Food name *"
        autoFocus
        className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Serving description — full width */}
      <input
        type="text"
        value={f.serving_description}
        onChange={e => upd({ serving_description: e.target.value })}
        placeholder="Serving (e.g. 1 cup)"
        className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Meal type — pill group, no dropdown, no overlay */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Meal type</p>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => upd({ meal_type: value })}
              aria-pressed={f.meal_type === value}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                f.meal_type === value
                  ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Macros: 2-col on mobile, 4-col on sm+ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Required indicators mirror the real contract (client check +
            /api/food-logs): food_name and calories are required; protein,
            carbs, and fat are optional and default to 0 when unknown. */}
        <MacroField label="Calories *" value={f.calories} onChange={v => upd({ calories: v })} />
        <MacroField label="Protein"    value={f.protein}  onChange={v => upd({ protein: v })}  unit="g" />
        <MacroField label="Carbs"      value={f.carbs}    onChange={v => upd({ carbs: v })}    unit="g" />
        <MacroField label="Fat"        value={f.fat}      onChange={v => upd({ fat: v })}      unit="g" />
      </div>

      {/* Soft warnings */}
      {highCalWarning && (
        <p className="text-xs text-amber-400 bg-amber-400/10 rounded px-2 py-1.5">{highCalWarning}</p>
      )}
      {crossCheck && (
        <p className="text-xs text-amber-400 bg-amber-400/10 rounded px-2 py-1.5">{crossCheck}</p>
      )}

      {/* Optional fields */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showMore ? '▲ Hide details' : '▼ Add fiber, sugar, sodium, notes'}
      </button>

      {showMore && (
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Fiber</p>
            <NInput value={f.fiber}  onChange={v => upd({ fiber: v })}  unit="g" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Sugar</p>
            <NInput value={f.sugar}  onChange={v => upd({ sugar: v })}  unit="g" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Sodium</p>
            <NInput value={f.sodium} onChange={v => upd({ sodium: v })} unit="mg" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <input
              type="text"
              value={f.notes}
              onChange={e => upd({ notes: e.target.value })}
              placeholder="Optional"
              className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Save as meal */}
      <div className="pt-1 border-t border-border space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={f.saveAsMeal}
            onChange={e => upd({ saveAsMeal: e.target.checked, mealName: e.target.checked ? f.food_name : '' })}
            className="rounded border-border flex-shrink-0"
          />
          <span className="text-xs text-muted-foreground">Save as a meal for quick-add later</span>
        </label>
        {f.saveAsMeal && (
          <div className="space-y-2 pl-5">
            <input
              type="text"
              value={f.mealName}
              onChange={e => upd({ mealName: e.target.value })}
              placeholder="Meal name"
              className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={f.isAutopilot}
                onChange={e => upd({ isAutopilot: e.target.checked })}
                className="rounded border-border flex-shrink-0"
              />
              <span className="text-xs text-muted-foreground">Show in autopilot (top of Quick Add)</span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </form>
  )
}
