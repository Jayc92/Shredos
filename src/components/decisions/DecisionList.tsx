'use client'

import { useState } from 'react'
import { DecisionCard } from './DecisionCard'
import { isDueForReview, needsFollowThrough } from '@/lib/decisions'
import { todayISO } from '@/lib/dates'
import type { DecisionLog, DecisionStatus } from '@/types/database'

interface DecisionListProps {
  decisions: DecisionLog[]
}

// Phase 3D: two follow-through filters join the existing status
// filters. Kept deliberately short for mobile usability; "Reviewed"
// was considered and skipped — reviewed decisions remain visible
// under All and their status filters.
type FilterValue = DecisionStatus | 'all' | 'needs_follow_through' | 'due_review'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'suggested', label: 'Pending' },
  { value: 'applied', label: 'Applied' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'needs_follow_through', label: 'Needs follow-through' },
  { value: 'due_review', label: 'Due for review' },
]

export function filterDecisions(
  decisions: DecisionLog[],
  filter: FilterValue,
  todayStr: string
): DecisionLog[] {
  if (filter === 'all') return decisions
  if (filter === 'needs_follow_through') return decisions.filter((d) => needsFollowThrough(d))
  if (filter === 'due_review') return decisions.filter((d) => isDueForReview(d, todayStr))
  return decisions.filter((d) => d.status === filter)
}

export function DecisionList({ decisions: initialDecisions }: DecisionListProps) {
  const [decisions, setDecisions] = useState(initialDecisions)
  const [filter, setFilter] = useState<FilterValue>('all')
  const today = todayISO()

  // Phase 3D: cards report the full normalized row the API returned,
  // so list state always mirrors the database (never an optimistic
  // guess).
  function handleDecisionChange(updated: DecisionLog) {
    setDecisions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  const filtered = filterDecisions(decisions, filter, today)
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
            {filter === 'suggested'
              ? 'No pending recommendations.'
              : filter === 'needs_follow_through'
              ? 'No decisions awaiting follow-through.'
              : filter === 'due_review'
              ? 'No decisions due for review.'
              : 'No entries for this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DecisionCard key={d.id} decision={d} onDecisionChange={handleDecisionChange} />
          ))}
        </div>
      )}
    </div>
  )
}
