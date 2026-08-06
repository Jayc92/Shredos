'use client'

import { useState } from 'react'
import { DecisionCard } from './DecisionCard'
import { FilterChip } from '@/components/ui/filter-chip'
import { Card, CardContent } from '@/components/ui/card'
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
      {/* Filter chips — same values, same semantics, same order
          (Phase 3D set); selection is check + border + weight via the
          FilterChip primitive, never color alone. */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(({ value, label }) => (
          <FilterChip
            key={value}
            selected={filter === value}
            onClick={() => setFilter(value)}
            count={value === 'suggested' ? pendingCount : undefined}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Card variant="status" className="gap-0 py-8">
          <CardContent className="text-center">
          <p className="text-sm text-ink-muted">
            {filter === 'suggested'
              ? 'No pending recommendations.'
              : filter === 'needs_follow_through'
              ? 'No decisions awaiting follow-through.'
              : filter === 'due_review'
              ? 'No decisions due for review.'
              : 'No decisions match this filter.'}
          </p>
          </CardContent>
        </Card>
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
