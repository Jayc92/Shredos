'use client'

import { useState } from 'react'
import { DecisionCard } from './DecisionCard'
import type { DecisionLog, DecisionStatus } from '@/types/database'

interface DecisionListProps {
  decisions: DecisionLog[]
}

const FILTERS: { value: DecisionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'suggested', label: 'Pending' },
  { value: 'applied', label: 'Applied' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'dismissed', label: 'Dismissed' },
]

export function DecisionList({ decisions: initialDecisions }: DecisionListProps) {
  const [decisions, setDecisions] = useState(initialDecisions)
  const [filter, setFilter] = useState<DecisionStatus | 'all'>('all')

  function handleStatusChange(id: string, status: string) {
    setDecisions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: status as DecisionStatus } : d))
    )
  }

  const filtered =
    filter === 'all' ? decisions : decisions.filter((d) => d.status === filter)

  const pendingCount = decisions.filter((d) => d.status === 'suggested').length

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === value
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            {value === 'suggested' && pendingCount > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="shred-card text-center py-8">
          <p className="text-sm text-muted-foreground">
            {filter === 'suggested' ? 'No pending recommendations.' : 'No entries for this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DecisionCard key={d.id} decision={d} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
