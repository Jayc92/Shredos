'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { kgToLbs } from '@/lib/units'
import { computeWeightChange, getTrendConfidence, confidenceLabel } from '@/lib/weighIn'
import { formatDateShort } from '@/lib/dates'
import type { BodyMetric, WeighInCadence } from '@/types/database'
import { Trash2 } from 'lucide-react'

interface WeighInHistoryProps {
  weighIns: BodyMetric[]
  cadence: WeighInCadence
}

export function WeighInHistory({ weighIns, cadence }: WeighInHistoryProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const confidence = getTrendConfidence(cadence, weighIns.length)
  const { label, color, note } = confidenceLabel(confidence)

  async function handleDelete(id: string) {
    if (!confirm('Delete this weigh-in?')) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('body_metrics').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  if (weighIns.length === 0) {
    return (
      <div className="shred-card text-center py-8 space-y-2">
        <p className="text-muted-foreground text-sm">No weigh-ins recorded yet.</p>
        <p className="text-xs text-muted-foreground">Log your first weigh-in above.</p>
      </div>
    )
  }

  return (
    <div className="shred-card space-y-4">
      {/* Confidence indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">History</h3>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>

      {confidence !== 'high' && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">{note}</p>
      )}

      {/* Weigh-in list */}
      <div className="space-y-1">
        {weighIns.map((w, i) => {
          const prev = weighIns[i + 1]
          const change =
            w.weight_kg && prev?.weight_kg
              ? computeWeightChange(w.weight_kg, prev.weight_kg)
              : null
          const lbs = w.weight_kg ? kgToLbs(w.weight_kg) : null

          return (
            <div
              key={w.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium tabular-nums">
                    {lbs !== null ? `${lbs.toFixed(1)} lbs` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateShort(w.logged_date + 'T00:00:00')}
                    {w.bf_pct ? ` · ${w.bf_pct}% BF` : ''}
                  </p>
                </div>
                {change && (
                  <span className={`text-xs font-medium ${change.color}`}>{change.label}</span>
                )}
              </div>

              <button
                onClick={() => handleDelete(w.id)}
                disabled={deleting === w.id}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                aria-label="Delete weigh-in"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {weighIns.length} weigh-in{weighIns.length !== 1 ? 's' : ''} recorded.
      </p>
    </div>
  )
}
