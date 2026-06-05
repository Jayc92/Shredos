import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SavedMeal, SavedMealInsert, SavedMealUpdate } from '@/types/database'

export function useSavedMeals() {
  const supabase = createClient()

  return useQuery<SavedMeal[]>({
    queryKey: ['saved-meals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('saved_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_autopilot', { ascending: false })
        .order('use_count', { ascending: false })
        .order('name', { ascending: true })

      return data ?? []
    },
    staleTime: 60_000,
  })
}

export function useCreateSavedMeal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<SavedMealInsert>) => {
      const res = await fetch('/api/saved-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create saved meal')
      }
      const { data } = await res.json()
      return data as SavedMeal
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-meals'] }),
  })
}

export function useUpdateSavedMeal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: SavedMealUpdate }) => {
      const res = await fetch(`/api/saved-meals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to update saved meal')
      }
      const { data } = await res.json()
      return data as SavedMeal
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-meals'] }),
  })
}

export function useDeleteSavedMeal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/saved-meals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete saved meal')
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-meals'] }),
  })
}

export function useQuickAddSavedMeal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, date, mealType }: { id: string; date: string; mealType: string }) => {
      const res = await fetch(`/api/saved-meals/${id}/quick-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, meal_type: mealType }),
      })
      if (!res.ok) throw new Error('Failed to quick-add meal')
      const { data } = await res.json()
      return data
    },
    onSuccess: (_data, { date }) => {
      qc.invalidateQueries({ queryKey: ['food-logs', date] })
      qc.invalidateQueries({ queryKey: ['saved-meals'] }) // use_count updated
    },
  })
}
