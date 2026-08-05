'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { SavedMealCard } from '@/components/food/SavedMealCard'
import { SavedMealForm } from '@/components/food/SavedMealForm'
import { createClient } from '@/lib/supabase/client'
import type { SavedMeal } from '@/types/database'

export default function SavedMealsPage() {
  const router = useRouter()
  const [meals, setMeals] = useState<SavedMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_autopilot', { ascending: false })
        .order('use_count', { ascending: false })
        .order('name', { ascending: true })

      setMeals(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Re-load after mutations
  function handleClose() {
    setShowCreate(false)
    router.refresh()
    // Re-fetch
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_autopilot', { ascending: false })
        .order('use_count', { ascending: false })
        .order('name', { ascending: true })
        .then(({ data }) => setMeals(data ?? []))
    })
  }

  if (loading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
  }

  const autopilot = meals.filter(m => m.is_autopilot)
  const rest = meals.filter(m => !m.is_autopilot)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Saved meals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quick-add common meals to your food log.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New meal
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="shred-card">
          <SavedMealForm onClose={handleClose} />
        </div>
      )}

      {meals.length === 0 && !showCreate && (
        <div className="shred-card text-center py-10 space-y-3">
          <p className="text-muted-foreground text-sm">No saved meals yet.</p>
          <p className="text-xs text-muted-foreground">
            Save common meals here to quick-add them to your food log. Mark meals as autopilot
            to show them at the top of Quick Add.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-primary hover:underline"
          >
            Create your first saved meal →
          </button>
        </div>
      )}

      {/* Autopilot meals */}
      {autopilot.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Autopilot meals
          </h2>
          {autopilot.map(meal => (
            <SavedMealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}

      {/* Other saved meals */}
      {rest.length > 0 && (
        <div className="space-y-3">
          {autopilot.length > 0 && (
            <h2 className="text-sm font-semibold text-foreground">Other saved meals</h2>
          )}
          {rest.map(meal => (
            <SavedMealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <a href="/food" className="text-sm text-primary hover:underline">
          ← Back to food log
        </a>
      </div>
    </div>
  )
}
