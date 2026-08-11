'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { MEAL_TYPES } from '@/lib/constants'
import { mealTypeLabel } from '@/lib/food'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { FoodLog, MealType } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface RecentFoodPanelProps {
  recentFoods: FoodLog[]
  date: string
}

interface RecentFoodConfirmProps {
  entry: FoodLog
  date: string
  onConfirm: (mealType: MealType) => void
  onCancel: () => void
  saving: boolean
}

function RecentFoodConfirm({ entry, date, onConfirm, onCancel, saving }: RecentFoodConfirmProps) {
  const [mealType, setMealType] = useState<MealType>(entry.meal_type)

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 mt-2">
      <p className="text-sm font-medium text-ink">
        Add <span className="text-primary">{entry.food_name}</span> to{' '}
        {date === new Date().toISOString().split('T')[0] ? 'today' : date}?
      </p>
      <div className="text-xs text-ink-muted space-x-3">
        <span>{entry.calories} cal</span>
        <span>{Number(entry.protein_g).toFixed(1)}g P</span>
        <span>{Number(entry.carbs_g).toFixed(1)}g C</span>
        <span>{Number(entry.fat_g).toFixed(1)}g F</span>
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

function RecentFoodRow({ entry, date }: { entry: FoodLog; date: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  async function handleConfirm(mealType: MealType) {
    setSaving(true)
    const res = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logged_date: date,
        meal_type: mealType,
        food_name: entry.food_name,
        serving_description: entry.serving_description,
        calories: entry.calories,
        protein_g: entry.protein_g,
        carbs_g: entry.carbs_g,
        fat_g: entry.fat_g,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setConfirming(false)
      setJustAdded(true)
      router.refresh()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between py-2 border-b border-edge-subtle/50 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{entry.food_name}</p>
          <p className="text-xs text-ink-muted tabular-nums">
            {entry.calories} cal · {Number(entry.protein_g).toFixed(1)}g P ·{' '}
            {Number(entry.carbs_g).toFixed(1)}g C · {Number(entry.fat_g).toFixed(1)}g F
            {' · '}
            {mealTypeLabel(entry.meal_type)}
          </p>
        </div>
        {justAdded ? (
          <span className="ml-2 text-xs text-green-400 flex-shrink-0">Added</span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(!confirming)}
            className="ml-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
            aria-label={`Add ${entry.food_name}`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
      </div>
      {confirming && (
        <RecentFoodConfirm
          entry={entry}
          date={date}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
          saving={saving}
        />
      )}
    </div>
  )
}

export function RecentFoodPanel({ recentFoods, date }: RecentFoodPanelProps) {
  if (recentFoods.length === 0) {
    return (
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="text-center py-4 space-y-1">
        <p className="text-sm text-ink-muted">
          No recent food logs yet — entries you add will show up here for quick repeat.
        </p>
      </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="subtle" className="gap-0 py-4">
      <CardContent className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Recent foods</h2>
      <div>
        {recentFoods.map((entry) => (
          <RecentFoodRow key={entry.id} entry={entry} date={date} />
        ))}
      </div>
    </CardContent>
    </Card>
  )
}
