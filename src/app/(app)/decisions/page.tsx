import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DecisionList } from '@/components/decisions/DecisionList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Decisions' }

export default async function DecisionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: decisions } = await supabase
    .from('decision_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const pendingCount = decisions?.filter((d) => d.status === 'suggested').length ?? 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Decision log</h1>
          {pendingCount > 0 && (
            <span className="text-xs font-medium bg-primary/15 text-primary rounded-full px-2.5 py-1">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Every recommendation and change is logged here. Nothing changes silently.
        </p>
      </div>

      <DecisionList decisions={decisions ?? []} />
    </div>
  )
}
