import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DecisionLog, DecisionLogInsert } from '@/types/database'

export function useDecisions(limit = 20) {
  const supabase = createClient()

  return useQuery<DecisionLog[]>({
    queryKey: ['decisions', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('decision_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      return data ?? []
    },
    staleTime: 30_000,
  })
}

export function useUpdateDecisionStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/decisions?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update decision')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decisions'] }),
  })
}

export function useCreateDecision() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<DecisionLogInsert>) => {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create decision')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decisions'] }),
  })
}
