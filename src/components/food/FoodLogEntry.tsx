'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { macroCrossCheckWarning } from '@/lib/food'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { FoodLog, MealType } from '@/types/database'

interface FoodLogEntryProps {
  entry: FoodLog
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'lunch',      label: 'Lunch' },
  { value: 'dinner',     label: 'Dinner' },
  { value: 'snack',      label: 'Snack' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'drink',      label: 'Drink' },
]

function NInput({ value, onChange, unit }: {
  value: string; onChange: (v: string) => void; unit?: string
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min="0"
        step="any"
        onChange={e => onChange(e.target.value)}
        onFocus={e => e.target.select()}
        className="w-full min-w-0 px-2 py-1.5 rounded-md bg-secondary border border-input text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {unit && <span className="text-xs text-muted-foreground select-none flex-shrink-0">{unit}</span>}
    </div>
  )
}

export function FoodLogEntry({ entry }: FoodLogEntryProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [foodName, setFoodName] = useState(entry.food_name)
  const [serving, setServing]   = useState(entry.serving_description ?? '')
  const [mealType, setMealType] = useState<MealType>(entry.meal_type)
  const [calories, setCalories] = useState(String(entry.calories))
  const [protein, setProtein]   = useState(String(Number(entry.protein_g)))
  const [carbs, setCarbs]       = useState(String(Number(entry.carbs_g)))
  const [fat, setFat]           = useState(String(Number(entry.fat_g)))
  const [notes, setNotes]       = useState(entry.notes ?? '')

  const cal    = parseInt(calories)  || 0
  const pro    = parseFloat(protein) || 0
  const carb   = parseFloat(carbs)   || 0
  const fatVal = parseFloat(fat)     || 0
  const crossCheck = cal > 0 ? macroCrossCheckWarning(cal, pro, carb, fatVal) : null

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!foodName.trim()) { setError('Name required'); return }
    setSaving(true)

    const res = await fetch(`/api/food-logs/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_name:           foodName.trim(),
        serving_description: serving.trim() || null,
        meal_type: mealType,
        calories: cal, protein_g: pro, carbs_g: carb, fat_g: fatVal,
        notes:    notes.trim() || null,
      }),
    })

    setSaving(false)
    if (!res.ok) { setError('Failed to save.'); return }
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${entry.food_name}"?`)) return
    setDeleting(true)
    await fetch(`/api/food-logs/${entry.id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSaveEdit}
        className="bg-muted/30 rounded-lg border border-border p-3 space-y-2.5 text-sm my-1"
      >
        {/* Name */}
        <input
          value={foodName}
          onChange={e => setFoodName(e.target.value)}
          autoFocus
          placeholder="Food name"
          className="w-full px-2 py-1.5 rounded-md bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />

        {/* Serving */}
        <input
          value={serving}
          onChange={e => setServing(e.target.value)}
          placeholder="Serving (optional)"
          className="w-full px-2 py-1.5 rounded-md bg-secondary border border-input text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />

        {/* Meal type — pill group, no dropdown */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Meal type</p>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMealType(value)}
                aria-pressed={mealType === value}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
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

        {/* Macros: 2-col on mobile, 4-col on sm+ */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Cal</p>
            <NInput value={calories} onChange={setCalories} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Protein</p>
            <NInput value={protein} onChange={setProtein} unit="g" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Carbs</p>
            <NInput value={carbs} onChange={setCarbs} unit="g" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Fat</p>
            <NInput value={fat} onChange={setFat} unit="g" />
          </div>
        </div>

        {crossCheck && (
          <p className="text-xs text-amber-400">{crossCheck}</p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{entry.food_name}</span>
          {entry.serving_description && (
            <span className="text-xs text-muted-foreground">{entry.serving_description}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span className="tabular-nums font-medium text-foreground">{entry.calories} cal</span>
          <span>{Number(entry.protein_g).toFixed(1)}g P</span>
          <span>{Number(entry.carbs_g).toFixed(1)}g C</span>
          <span>{Number(entry.fat_g).toFixed(1)}g F</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
          aria-label="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors disabled:opacity-40"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
