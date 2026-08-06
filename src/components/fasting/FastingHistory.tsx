'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getFastingDuration, formatDuration } from '@/lib/fasting'
import { formatDateShort, formatTime } from '@/lib/dates'
import { FASTING_TYPE_LABELS } from '@/lib/constants'
import { Trash2 } from 'lucide-react'
import type { FastingLog } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface FastingHistoryProps {
  fasts: FastingLog[]
}

export function FastingHistory({ fasts }: FastingHistoryProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const completed = fasts.filter((f) => f.ended_at !== null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this fasting log?')) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('fasting_logs').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  if (completed.length === 0) {
    return (
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="text-center py-6">
        <p className="text-sm text-ink-muted">No completed fasts yet.</p>
      </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <h3 className="text-sm font-medium text-ink">History</h3>
      <div className="space-y-1">
        {completed.map((fast) => {
          const { minutes } = getFastingDuration(fast.started_at, fast.ended_at)
          const startDate = new Date(fast.started_at)

          return (
            <div
              key={fast.id}
              className="flex items-center justify-between py-2 border-b border-edge-subtle last:border-0"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tabular-nums">{formatDuration(minutes)}</p>
                  {fast.completed_goal === true && (
                    <span className="text-xs text-green-400">✓ goal</span>
                  )}
                  {fast.completed_goal === false && (
                    <span className="text-xs text-ink-muted">goal not met</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted">
                  {formatDateShort(startDate)} · {formatTime(startDate)} ·{' '}
                  {FASTING_TYPE_LABELS[fast.fasting_type] ?? fast.fasting_type}
                  {fast.goal_hours ? ` · goal ${fast.goal_hours}h` : ''}
                </p>
                {fast.notes && (
                  <p className="text-xs text-ink-muted italic">{fast.notes}</p>
                )}
              </div>

              <button
                onClick={() => handleDelete(fast.id)}
                disabled={deleting === fast.id}
                className="p-1.5 text-ink-muted hover:text-destructive transition-colors disabled:opacity-40"
                aria-label="Delete fast"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </CardContent>
    </Card>
  )
}
