'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Zap } from 'lucide-react'
import { SavedMealForm } from './SavedMealForm'
import type { SavedMeal } from '@/types/database'
import { mealTypeLabel } from '@/lib/food'

interface SavedMealCardProps {
  meal: SavedMeal
}

export function SavedMealCard({ meal }: SavedMealCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${meal.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/saved-meals/${meal.id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (editing) {
    return (
      <div className="shred-card">
        <SavedMealForm existing={meal} onClose={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="shred-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {meal.is_autopilot && (
              <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-label="Autopilot" />
            )}
            <h3 className="text-sm font-semibold text-foreground truncate">{meal.name}</h3>
            {meal.is_autopilot && (
              <span className="text-xs bg-amber-400/15 text-amber-400 rounded-full px-2 py-0.5 flex-shrink-0">
                Autopilot
              </span>
            )}
          </div>
          {meal.meal_type_default && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Default: {mealTypeLabel(meal.meal_type_default)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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

      {/* Macros */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Cal', value: meal.calories, isInt: true },
          { label: 'Protein', value: Number(meal.protein_g), unit: 'g' },
          { label: 'Carbs', value: Number(meal.carbs_g), unit: 'g' },
          { label: 'Fat', value: Number(meal.fat_g), unit: 'g' },
        ].map(({ label, value, unit, isInt }) => (
          <div key={label} className="bg-secondary rounded-lg py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              {isInt ? value.toLocaleString() : value.toFixed(1)}{unit ?? ''}
            </p>
          </div>
        ))}
      </div>

      {/* Usage */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {meal.use_count > 0 && (
          <span>Used {meal.use_count}×</span>
        )}
        {meal.last_used_at && (
          <span>Last: {new Date(meal.last_used_at).toLocaleDateString()}</span>
        )}
        {meal.notes && (
          <span className="italic truncate">{meal.notes}</span>
        )}
      </div>
    </div>
  )
}
