'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { MealType } from '@/types/database'

interface LabelCalculatorFormProps {
  date: string
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'lunch',      label: 'Lunch' },
  { value: 'dinner',     label: 'Dinner' },
  { value: 'snack',      label: 'Snack' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'drink',      label: 'Drink' },
]

const MAX_SERVINGS = 50

const EMPTY = {
  foodName: '', servings: '1',
  calories: '', protein: '', carbs: '', fat: '',
  fiber: '', sugar: '', sodium: '',
}

export function LabelCalculatorForm({ date }: LabelCalculatorFormProps) {
  const router = useRouter()
  const [f, setF] = useState(EMPTY)
  const [mealType, setMealType] = useState<MealType>('snack')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const upd = (patch: Partial<typeof EMPTY>) => setF((prev) => ({ ...prev, ...patch }))

  // Live preview — reflects current input state, not final validation
  const previewServings = parseFloat(f.servings) || 0
  const previewCal   = Math.round((parseFloat(f.calories) || 0) * previewServings)
  const previewPro   = Math.round((parseFloat(f.protein)  || 0) * previewServings * 10) / 10
  const previewCarb  = Math.round((parseFloat(f.carbs)    || 0) * previewServings * 10) / 10
  const previewFat   = Math.round((parseFloat(f.fat)      || 0) * previewServings * 10) / 10
  const showPreview = f.calories !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!f.foodName.trim()) {
      setError('Food name is required.')
      return
    }

    const servingsVal = parseFloat(f.servings)
    if (!f.servings || isNaN(servingsVal) || servingsVal <= 0 || servingsVal > MAX_SERVINGS) {
      setError(`Servings must be greater than 0 and up to ${MAX_SERVINGS}.`)
      return
    }

    const caloriesVal = parseFloat(f.calories)
    if (f.calories === '' || isNaN(caloriesVal) || caloriesVal < 0) {
      setError('Calories per serving is required and must be 0 or more.')
      return
    }

    // Protein/carbs/fat: blank treated as 0, but a provided value can't be negative
    const proteinVal = f.protein === '' ? 0 : parseFloat(f.protein)
    const carbsVal    = f.carbs   === '' ? 0 : parseFloat(f.carbs)
    const fatVal      = f.fat     === '' ? 0 : parseFloat(f.fat)
    if ([proteinVal, carbsVal, fatVal].some((v) => isNaN(v) || v < 0)) {
      setError('Protein, carbs, and fat cannot be negative.')
      return
    }

    // Optional fiber/sugar/sodium: blank stays null, but a provided value can't be negative
    const fiberVal  = f.fiber  === '' ? null : parseFloat(f.fiber)
    const sugarVal  = f.sugar  === '' ? null : parseFloat(f.sugar)
    const sodiumVal = f.sodium === '' ? null : parseFloat(f.sodium)
    if ([fiberVal, sugarVal, sodiumVal].some((v) => v !== null && (isNaN(v) || v < 0))) {
      setError('Fiber, sugar, and sodium cannot be negative.')
      return
    }

    setSaving(true)

    const servingDescription = `${servingsVal} serving${servingsVal !== 1 ? 's' : ''} (from label)`

    const res = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logged_date: date,
        meal_type: mealType,
        food_name: f.foodName.trim(),
        serving_description: servingDescription,
        calories: Math.round(caloriesVal * servingsVal),
        protein_g: Math.round(proteinVal * servingsVal * 10) / 10,
        carbs_g: Math.round(carbsVal * servingsVal * 10) / 10,
        fat_g: Math.round(fatVal * servingsVal * 10) / 10,
        fiber_g: fiberVal !== null ? Math.round(fiberVal * servingsVal * 10) / 10 : null,
        sugar_g: sugarVal !== null ? Math.round(sugarVal * servingsVal * 10) / 10 : null,
        sodium_mg: sodiumVal !== null ? Math.round(sodiumVal * servingsVal) : null,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to log from label.')
      return
    }

    setSuccess(true)
    setF(EMPTY)
    setMealType('snack')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="shred-card space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Nutrition label calculator</h2>
      <p className="text-xs text-muted-foreground">
        Use the label values per serving, then enter how much you ate.
      </p>

      <input
        type="text"
        value={f.foodName}
        onChange={(e) => upd({ foodName: e.target.value })}
        placeholder="Food name"
        className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
      />

      {/* Meal type — pill group, same selected-state convention used elsewhere */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Meal type</p>
        <div className="flex flex-wrap gap-2">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Servings eaten</label>
          <input
            type="number"
            inputMode="decimal"
            value={f.servings}
            onChange={(e) => upd({ servings: e.target.value })}
            min="0.01"
            max={MAX_SERVINGS}
            step="any"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Calories / serving</label>
          <input
            type="number"
            inputMode="decimal"
            value={f.calories}
            onChange={(e) => upd({ calories: e.target.value })}
            min="0"
            step="any"
            placeholder="0"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">Protein (g)</label>
          <input
            type="number" inputMode="decimal" value={f.protein}
            onChange={(e) => upd({ protein: e.target.value })}
            min="0" step="any" placeholder="0"
            className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">Carbs (g)</label>
          <input
            type="number" inputMode="decimal" value={f.carbs}
            onChange={(e) => upd({ carbs: e.target.value })}
            min="0" step="any" placeholder="0"
            className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">Fat (g)</label>
          <input
            type="number" inputMode="decimal" value={f.fat}
            onChange={(e) => upd({ fat: e.target.value })}
            min="0" step="any" placeholder="0"
            className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Optional micros */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">
            Fiber (g) <span className="font-normal">(optional)</span>
          </label>
          <input
            type="number" inputMode="decimal" value={f.fiber}
            onChange={(e) => upd({ fiber: e.target.value })}
            min="0" step="any" placeholder="—"
            className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">
            Sugar (g) <span className="font-normal">(optional)</span>
          </label>
          <input
            type="number" inputMode="decimal" value={f.sugar}
            onChange={(e) => upd({ sugar: e.target.value })}
            min="0" step="any" placeholder="—"
            className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-muted-foreground">
            Sodium (mg) <span className="font-normal">(optional)</span>
          </label>
          <input
            type="number" inputMode="decimal" value={f.sodium}
            onChange={(e) => upd({ sodium: e.target.value })}
            min="0" step="any" placeholder="—"
            className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Live preview */}
      {showPreview && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          Preview: {previewCal} cal · {previewPro}g protein · {previewCarb}g carbs · {previewFat}g fat
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
          ✓ Logged from label.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Logging…' : 'Log from label'}
      </button>
    </form>
  )
}
