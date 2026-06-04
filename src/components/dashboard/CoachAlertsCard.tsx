'use client'

import { useState } from 'react'
import { BrainCircuit, CheckCircle, XCircle } from 'lucide-react'
import { formatRelativeDate } from '@/lib/dates'
import type { DecisionLog } from '@/types/database'

interface CoachAlertsCardProps {
  decisions: DecisionLog[]
}

export function CoachAlertsCard({ decisions }: CoachAlertsCardProps) {
  const pending = decisions.filter((d) => d.status === 'suggested')
  const [actioned, setActioned] = useState<Set<string>>(new Set())

  async function updateStatus(id: string, status: 'accepted' | 'dismissed') {
    setActioned((prev) => {
  const next = new Set(prev)
  next.add(id)
  return next
})
    try {
      await fetch(`/api/decisions?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch (e) {
      console.error('Failed to update decision status:', e)
      setActioned((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const visiblePending = pending.filter((d) => !actioned.has(d.id))

  return (
    <div className="shred-card space-y-3">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Coach alerts</span>
        {visiblePending.length > 0 && (
          <span className="ml-auto text-xs font-medium bg-primary/15 text-primary rounded-full px-2 py-0.5">
            {visiblePending.length}
          </span>
        )}
      </div>

      {visiblePending.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No pending alerts. Keep logging consistently.
        </p>
      ) : (
        <div className="space-y-3">
          {visiblePending.slice(0, 2).map((decision) => (
            <div
              key={decision.id}
              className="bg-secondary rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {decision.decision_title}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatRelativeDate(decision.created_at)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{decision.decision_summary}</p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => updateStatus(decision.id, 'accepted')}
                  className="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(decision.id, 'dismissed')}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
          ))}

          {visiblePending.length > 2 && (
            <a href="/decisions" className="text-xs text-primary hover:underline block text-center">
              View {visiblePending.length - 2} more alerts →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
