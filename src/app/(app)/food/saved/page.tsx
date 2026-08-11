'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { SavedMealCard } from '@/components/food/SavedMealCard'
import { FuelSubNav } from '@/components/food/FuelSubNav'
import { Card, CardContent } from '@/components/ui/card'
import { SavedMealForm } from '@/components/food/SavedMealForm'
import { createClient } from '@/lib/supabase/client'
import type { SavedMeal } from '@/types/database'
// Client fetch state reuses the route's loading.tsx composition —
// identical skeleton for router navigation and client query, never a
// bare text fallback (4B.6C QA correction).
import SavedMealsLoading from './loading'

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
    return <SavedMealsLoading />
  }

  const autopilot = meals.filter(m => m.is_autopilot)
  const rest = meals.filter(m => !m.is_autopilot)

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Saved meals</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Quick-add common meals to your food log.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-[var(--radius-control)] bg-brand text-brand-foreground text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New meal
        </button>
      </div>

      <FuelSubNav />

      {/* Create form */}
      {showCreate && (
        <Card variant="elevated" className="gap-0 py-4">
          <CardContent>
            <SavedMealForm onClose={handleClose} />
          </CardContent>
        </Card>
      )}

      {meals.length === 0 && !showCreate && (
        <Card variant="status" className="gap-0 py-10">
          <CardContent className="space-y-3 text-center">
          <p className="text-ink-muted text-sm">No saved meals yet.</p>
          <p className="text-xs text-ink-muted">
            Save common meals here to quick-add them to your food log. Mark meals as autopilot
            to show them at the top of Quick Add.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-brand hover:underline"
          >
            Create your first saved meal →
          </button>
          </CardContent>
        </Card>
      )}

      {/* Autopilot meals */}
      {autopilot.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
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
            <h2 className="text-sm font-semibold text-ink">Other saved meals</h2>
          )}
          {rest.map(meal => (
            <SavedMealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}

    </div>
  )
}
