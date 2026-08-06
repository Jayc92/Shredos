import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DecisionList } from '@/components/decisions/DecisionList'
import { CoachSubNav } from '@/components/coach/CoachSubNav'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink">Decisions</h1>
          {/* Grounded count: this page loads the full uncapped list. */}
          {pendingCount > 0 && (
            <span className="rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-semibold text-ink">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Every recommendation and change is logged here. Nothing changes silently.
        </p>
      </div>

      <CoachSubNav />

      {/* Lifecycle context — existing vocabulary only; not every
          decision follows every stage. */}
      <Card variant="subtle" className="gap-0 py-3">
        <CardContent className="space-y-1">
          <p className="text-xs text-ink-muted">
            <span className="font-medium text-ink">Lifecycle:</span> Suggested →
            Accepted or Applied → Follow-through → Review outcome.
          </p>
          <p className="text-xs text-ink-muted">
            Not every decision follows every stage — dismissed decisions stay in
            the log, and follow-through can be marked not applicable.
          </p>
        </CardContent>
      </Card>

      <DecisionList decisions={decisions ?? []} />
    </div>
  )
}
