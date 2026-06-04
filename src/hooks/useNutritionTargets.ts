import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { NutritionTarget } from '@/types/database'

export function useCurrentNutritionTarget() {
  const supabase = createClient()

  return useQuery<NutritionTarget | null>({
    queryKey: ['nutrition', 'current'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', user.id)
        .lte('effective_date', today)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      return data ?? null
    },
    staleTime: 60_000,
  })
}
