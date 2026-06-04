'use client'

import { useState } from 'react'
import { formatRelativeDate, formatDateShort } from '@/lib/dates'
import { DECISION_STATUS_LABELS, DECISION_TYPE_LABELS } from '@/lib/constants'
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import type { DecisionLog } from '@/types/database'

const STATUS_STYLES: Record<string, string> = {
  suggested: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  accepted: 'text-green-400 bg-green-400/10 border-green-400/20',
  dismissed: 'text-muted-foreground bg-secondary border-border',
  applied: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  reversed: 'text-red-400 bg-red-400/10 border-red-400/20',
}

interface DecisionCardProps {
  decision: DecisionLog
  onStatusChange?: (id: string, status: string) => void
}

export function DecisionCard({ decision, onStatusChange }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actioning, setActioning] = useState(false)

  async function handleAction(status: 'accepted' | 'dismissed') {
    setActioning(true)
    try {
      await fetch(`/api/decisions?id=${decision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      onStatusChange?.(decision.id, status)
    } finally {
      setActioning(false)
    }
  }

  const statusStyle = STATUS_STYLES[decision.status] ?? STATUS_STYLES.applied

  return (
    <div className="shred-card space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{decision.decision_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {DECISION_TYPE_LABELS[decision.decision_type] ?? decision.decision_type} ·{' '}
            {formatRelativeDate(decision.created_at)} ·{' '}
            {decision.created_by === 'user' ? 'You' : decision.created_by === 'coach' ? 'Coach' : 'System'}
          </p>
        </div>
        <span className={`text-xs font-medium rounded-full px-2.5 py-1 border flex-shrink-0 ${statusStyle}`}>
          {DECISION_STATUS_LABELS[decision.status] ?? decision.status}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">{decision.decision_summary}</p>

      {/* Expand/collapse full reason */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Less detail' : 'Full reason'}
      </button>

      {expanded && (
        <div className="space-y-3 pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">{decision.reason}</p>

          {/* Value change display */}
          {(decision.previous_value || decision.new_value) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {decision.previous_value && (
                <div className="bg-secondary rounded px-2 py-1.5">
                  <p className="text-muted-foreground mb-1">Before</p>
                  <pre className="text-foreground font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(decision.previous_value, null, 2)}
                  </pre>
                </div>
              )}
              {decision.new_value && (
                <div className="bg-primary/5 border border-primary/20 rounded px-2 py-1.5">
                  <p className="text-muted-foreground mb-1">After</p>
                  <pre className="text-primary font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(decision.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {decision.applied_at && (
            <p className="text-xs text-muted-foreground">
              Applied: {formatDateShort(new Date(decision.applied_at))}
            </p>
          )}
          {decision.notes && (
            <p className="text-xs text-muted-foreground italic">{decision.notes}</p>
          )}
        </div>
      )}

      {/* Accept / Dismiss actions */}
      {decision.status === 'suggested' && (
        <div className="flex gap-3 pt-1 border-t border-border">
          <button
            onClick={() => handleAction('accepted')}
            disabled={actioning}
            className="flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={() => handleAction('dismissed')}
            disabled={actioning}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
