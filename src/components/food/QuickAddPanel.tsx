'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Zap, Plus } from 'lucide-react'
import { MEAL_TYPES } from '@/lib/constants'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { SavedMeal, MealType } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface QuickAddPanelProps {
  savedMeals: SavedMeal[]
  date: string
}

interface QuickAddConfirmProps {
  meal: SavedMeal
  date: string
  onConfirm: (mealType: MealType) => void
  onCancel: () => void
  saving: boolean
}

function QuickAddConfirm({ meal, date, onConfirm, onCancel, saving }: QuickAddConfirmProps) {
  const [mealType, setMealType] = useState<MealType>(meal.meal_type_default ?? 'snack')

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 mt-2">
      <p className="text-sm font-medium text-ink">
        Add <span className="text-primary">{meal.name}</span> to {date === new Date().toISOString().split('T')[0] ? 'today' : date}?
      </p>
      <div className="text-xs text-ink-muted space-x-3">
        <span>{meal.calories} cal</span>
        <span>{Number(meal.protein_g).toFixed(1)}g P</span>
        <span>{Number(meal.carbs_g).toFixed(1)}g C</span>
        <span>{Number(meal.fat_g).toFixed(1)}g F</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-ink-muted flex-shrink-0">Meal type:</label>
        <Select value={mealType} onValueChange={(v: string) => setMealType(v as MealType)}>
          <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MEAL_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 text-xs text-ink-muted border border-border rounded-lg hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="button" onClick={() => onConfirm(mealType)} disabled={saving}
          className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

function SavedMealRow({ meal, date }: { meal: SavedMeal; date: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleConfirm(mealType: MealType) {
    setSaving(true)
    const res = await fetch(`/api/saved-meals/${meal.id}/quick-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, meal_type: mealType }),
    })
    setSaving(false)
    if (res.ok) {
      setConfirming(false)
      router.refresh()
    }
  }

  return (
    <div>
      <div className={`flex items-center justify-between py-2 border-b border-edge-subtle/50 last:border-0 ${meal.is_autopilot ? 'py-2.5' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {meal.is_autopilot && (
            <Zap className="w-3.5 h-3.5 text-caution flex-shrink-0" aria-label="Autopilot" />
          )}
          <div className="min-w-0">
            <p className={`text-sm font-medium text-ink truncate ${meal.is_autopilot ? '' : 'text-ink'}`}>
              {meal.name}
            </p>
            <p className="text-xs text-ink-muted tabular-nums">
              {meal.calories} cal · {Number(meal.protein_g).toFixed(1)}g P · {Number(meal.carbs_g).toFixed(1)}g C · {Number(meal.fat_g).toFixed(1)}g F
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(!confirming)}
          className="ml-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          aria-label={`Quick-add ${meal.name}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
      {confirming && (
        <QuickAddConfirm
          meal={meal}
          date={date}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
          saving={saving}
        />
      )}
    </div>
  )
}

export function QuickAddPanel({ savedMeals, date }: QuickAddPanelProps) {
  const [open, setOpen] = useState(false)

  const autopilot = savedMeals.filter(m => m.is_autopilot)
  const rest      = savedMeals.filter(m => !m.is_autopilot)

  if (savedMeals.length === 0) {
    return (
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="text-center py-4 space-y-1">
        <p className="text-sm text-ink-muted">No saved meals yet.</p>
        <a href="/food/saved" className="text-xs text-brand hover:underline">
          Create saved meals →
        </a>
      </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="subtle" className="gap-0 py-4">
      <CardContent className="space-y-2">
      {/* Food-log UX fix: "Quick Add" read as if it governed BOTH
          shortcut lists; this disclosure controls only saved meals,
          so it is named exactly that. 44px target + associated
          controlled region. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex min-h-11 items-center justify-between text-sm font-semibold text-ink"
        aria-expanded={open}
        aria-controls="saved-meals-panel"
      >
        <span>Saved meals</span>
        <div className="flex items-center gap-2">
          {!open && autopilot.length > 0 && (
            <span className="text-xs text-caution flex items-center gap-1">
              <Zap className="w-3 h-3" />{autopilot.length} autopilot
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
        </div>
      </button>

      {open && (
        <div id="saved-meals-panel">
          {/* Autopilot meals first */}
          {autopilot.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-caution font-medium mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Autopilot
              </p>
              {autopilot.map(m => <SavedMealRow key={m.id} meal={m} date={date} />)}
            </div>
          )}

          {/* Other saved meals */}
          {rest.length > 0 && (
            <div>
              {autopilot.length > 0 && (
                <p className="text-xs text-ink-muted font-medium mt-3 mb-1">Other saved meals</p>
              )}
              {rest.map(m => <SavedMealRow key={m.id} meal={m} date={date} />)}
            </div>
          )}

          <div className="pt-2 border-t border-edge-subtle mt-2">
            <a href="/food/saved" className="text-xs text-brand hover:underline">
              Manage saved meals →
            </a>
          </div>
        </div>
      )}
    </CardContent>
    </Card>
  )
}
