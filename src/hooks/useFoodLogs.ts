import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { FoodLog, FoodLogInsert, FoodLogUpdate } from '@/types/database'

export function useFoodLogs(date: string) {
  const supabase = createClient()

  return useQuery<FoodLog[]>({
    queryKey: ['food-logs', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', date)
        .order('created_at', { ascending: true })

      return data ?? []
    },
    staleTime: 30_000,
  })
}

export function useCreateFoodLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<FoodLogInsert>) => {
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create food log')
      }
      const { data } = await res.json()
      return data as FoodLog
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['food-logs', data.logged_date] })
    },
  })
}

export function useUpdateFoodLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: FoodLogUpdate }) => {
      const res = await fetch(`/api/food-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error('Failed to update food log')
      const { data } = await res.json()
      return data as FoodLog
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['food-logs', data.logged_date] })
    },
  })
}

export function useDeleteFoodLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const res = await fetch(`/api/food-logs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete food log')
      return { id, date }
    },
    onSuccess: ({ date }) => {
      qc.invalidateQueries({ queryKey: ['food-logs', date] })
    },
  })
}
