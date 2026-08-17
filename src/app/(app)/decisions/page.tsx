import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DecisionList } from '@/components/decisions/DecisionList'
import { CoachSubNav } from '@/components/coach/CoachSubNav'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowRight } from 'lucide-react'
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
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
      {/* UI-6C: PageHeader primitive; the grounded pending count (this
          page loads the full uncapped list) rides the action slot. */}
      <PageHeader
        title="Decisions"
        description="Every recommendation and change is logged here. Nothing changes silently."
        action={
          pendingCount > 0 ? (
            <span className="rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-semibold text-ink">
              {pendingCount} pending
            </span>
          ) : undefined
        }
      />

      <CoachSubNav />

      {/* Lifecycle context — existing vocabulary only; not every
          decision follows every stage. */}
      <Card variant="subtle" className="gap-0 py-3">
        <CardContent className="space-y-1">
          <p className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
            <span className="font-medium text-ink">Lifecycle:</span>
            Suggested
            <ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Accepted or Applied
            <ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Follow-through
            <ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Review outcome.
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
