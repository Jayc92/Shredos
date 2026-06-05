'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { FoodLogEntry } from './FoodLogEntry'
import { AddFoodForm } from './AddFoodForm'
import type { FoodLog, MealType } from '@/types/database'

interface MealSectionProps {
  mealType: MealType
  label: string
  entries: FoodLog[]
  date: string
}

export function MealSection({ mealType, label, entries, date }: MealSectionProps) {
  const hasEntries = entries.length > 0
  const [open, setOpen] = useState(hasEntries)
  const [showAdd, setShowAdd] = useState(false)

  const totalCal = entries.reduce((s, e) => s + e.calories, 0)
  const totalPro = entries.reduce((s, e) => s + Number(e.protein_g), 0)

  return (
    <div className="shred-card space-y-1">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {hasEntries && (
            <span className="text-xs text-muted-foreground ml-1">
              {entries.length} item{entries.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>
        {hasEntries && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
            <span>{totalCal} cal</span>
            <span>{Math.round(totalPro * 10) / 10}g P</span>
          </div>
        )}
      </div>

      {/* Entries */}
      {open && (
        <div className="pt-1">
          {entries.length > 0 && (
            <div className="mb-2">
              {entries.map((entry) => (
                <FoodLogEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          {/* Add form */}
          {showAdd ? (
            <AddFoodForm
              date={date}
              defaultMealType={mealType}
              onClose={() => setShowAdd(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {label.toLowerCase()}
            </button>
          )}
        </div>
      )}

      {/* Collapsed state — show add button if no entries */}
      {!open && !hasEntries && (
        <button
          type="button"
          onClick={() => { setOpen(true); setShowAdd(true) }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-0.5 pl-6"
        >
          <Plus className="w-3 h-3" />
          Add {label.toLowerCase()}
        </button>
      )}
    </div>
  )
}
