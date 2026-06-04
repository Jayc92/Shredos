import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { didCompleteGoal, fastingTypeFromHours } from '@/lib/fasting'
import { startOfWeekISO } from '@/lib/dates'
import type { FastingLog, FastingLogInsert } from '@/types/database'

export function useActiveFast() {
  const supabase = createClient()

  return useQuery<FastingLog | null>({
    queryKey: ['fasting', 'active'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await supabase
        .from('fasting_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .single()

      return data ?? null
    },
    refetchInterval: 60_000, // refresh every minute to keep in sync
  })
}

export function useFastingLogs(limit = 30) {
  const supabase = createClient()

  return useQuery<FastingLog[]>({
    queryKey: ['fasting', 'history', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('fasting_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit)

      return data ?? []
    },
    staleTime: 30_000,
  })
}

export function useStartFast() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ goalHours }: { goalHours: number | null }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('fasting_logs')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
          ended_at: null,
          fasting_type: goalHours ? fastingTypeFromHours(goalHours) : 'intermittent',
          goal_hours: goalHours,
          completed_goal: null,
          notes: null,
        } as FastingLogInsert)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('You already have an active fast.')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasting'] })
    },
  })
}

export function useEndFast() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (fast: FastingLog) => {
      const endedAt = new Date().toISOString()
      const completed = didCompleteGoal(fast.started_at, endedAt, fast.goal_hours)

      const { data, error } = await supabase
        .from('fasting_logs')
        .update({ ended_at: endedAt, completed_goal: completed })
        .eq('id', fast.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasting'] })
    },
  })
}
