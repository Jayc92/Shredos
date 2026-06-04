import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BodyMetric } from '@/types/database'

export function useWeighIns(limit = 20) {
  const supabase = createClient()

  return useQuery<BodyMetric[]>({
    queryKey: ['weigh-ins', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', user.id)
        .not('weight_kg', 'is', null)
        .order('logged_date', { ascending: false })
        .limit(limit)

      return data ?? []
    },
    staleTime: 30_000,
  })
}
