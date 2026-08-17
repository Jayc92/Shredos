'use client'

import { useState } from 'react'
import { formatRelativeDate, formatDateShort, todayISO } from '@/lib/dates'
import { DECISION_STATUS_LABELS, DECISION_TYPE_LABELS } from '@/lib/constants'
import {
  FOLLOW_THROUGH_LABELS,
  OUTCOME_LABELS,
  DECISION_OUTCOME_VALUES,
  OUTCOME_NOTES_MAX_LENGTH,
  followThroughOf,
  outcomeOf,
  isFollowThroughEligible,
  isOutcomeEligible,
  isDueForReview,
  isReviewDateSaveable,
} from '@/lib/decisions'
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DecisionLog, DecisionOutcome } from '@/types/database'

const STATUS_STYLES: Record<string, string> = {
  suggested: 'text-caution bg-caution-subtle border-caution/20',
  accepted: 'text-success bg-success-subtle border-success/20',
  dismissed: 'text-ink-muted bg-surface-sunken border-edge-subtle',
  applied: 'text-info bg-info-subtle border-info/20',
  reversed: 'text-critical bg-critical-subtle border-critical/20',
}

/**
 * Phase 4B.4 state-driven Card variant (deterministic precedence):
 * a pending suggestion has direct user actions → `action`; a decision
 * due for review needs attention → `status`; dismissed/reversed are
 * historical → `subtle`; active accepted/applied decisions → `elevated`.
 * Presentation only — no state is computed differently.
 */
function cardVariantFor(
  status: string,
  dueForReview: boolean
): 'action' | 'status' | 'subtle' | 'elevated' {
  if (status === 'suggested') return 'action'
  if (dueForReview) return 'status'
  if (status === 'dismissed' || status === 'reversed') return 'subtle'
  return 'elevated'
}

interface DecisionCardProps {
  decision: DecisionLog
  /** Phase 3D: the card reports the full normalized row returned by
   * the API, so the list state always mirrors the database. */
  onDecisionChange?: (updated: DecisionLog) => void
}

export function DecisionCard({ decision, onDecisionChange }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Phase 3D QA fix: initialize the review-date input to a REAL value
  // (the persisted date, or today as the convenience default) so what
  // the browser displays always matches component state. Previously a
  // null review_on left the input value '' — which Safari renders as
  // today's date — while the save button's dirty check compared
  // '' === '' and stayed disabled: the user saw a date but the button
  // did nothing, and null-vs-today were conflated.
  const [reviewDateInput, setReviewDateInput] = useState(decision.review_on ?? todayISO())
  const [outcomeInput, setOutcomeInput] = useState<DecisionOutcome | ''>(outcomeOf(decision) ?? '')
  const [outcomeNotesInput, setOutcomeNotesInput] = useState(decision.outcome_notes ?? '')

  const followThrough = followThroughOf(decision)
  const outcome = outcomeOf(decision)
  const today = todayISO()
  const dueForReview = isDueForReview(decision, today)
  const manageable = isFollowThroughEligible(decision.status)

  /**
   * One explicit user action → one PATCH. A failed update leaves the
   * card exactly as it was and shows the server's user-readable
   * message; local state only changes from the returned row.
   */
  async function handleUpdate(patch: Record<string, unknown>) {
    setActioning(true)
    setError(null)
    try {
      const res = await fetch(`/api/decisions?id=${decision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Unable to update decision.')
        return
      }
      if (body.data) onDecisionChange?.(body.data as DecisionLog)
    } catch {
      setError('Unable to update decision.')
    } finally {
      setActioning(false)
    }
  }

  const statusStyle = STATUS_STYLES[decision.status] ?? STATUS_STYLES.applied

  return (
    <Card variant={cardVariantFor(decision.status, dueForReview)} className="gap-0 py-4">
      <CardContent className="space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink leading-snug">{decision.decision_title}</p>
          <p className="text-xs text-ink-muted mt-0.5">
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
      <p className="text-sm text-ink-muted">{decision.decision_summary}</p>

      {/* Compact Phase 3D state line — only when something exists */}
      {(followThrough !== 'not_started' || outcome !== null || dueForReview || decision.review_on) && (
        <div className="flex gap-2 flex-wrap">
          {followThrough !== 'not_started' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-sunken text-ink-muted font-medium">
              Follow-through: {FOLLOW_THROUGH_LABELS[followThrough]}
            </span>
          )}
          {outcome !== null && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-sunken text-ink-muted font-medium">
              Outcome: {OUTCOME_LABELS[outcome]}
            </span>
          )}
          {dueForReview ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-caution-subtle text-caution font-medium">
              Review now
            </span>
          ) : decision.review_on && !decision.reviewed_at ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-sunken text-ink-muted font-medium">
              Review on {formatDateShort(decision.review_on + 'T00:00:00')}
            </span>
          ) : null}
        </div>
      )}

      {/* Expand/collapse full reason + management */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-11 items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" aria-hidden="true" /> : <ChevronDown className="w-3 h-3" aria-hidden="true" />}
        {expanded ? 'Less detail' : manageable ? 'Details & follow-through' : 'Full reason'}
      </button>

      {expanded && (
        <div className="space-y-3 pt-1 border-t border-edge-subtle">
          <p className="text-xs text-ink-muted leading-relaxed">{decision.reason}</p>

          {/* Value change display */}
          {(decision.previous_value || decision.new_value) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {decision.previous_value && (
                <div className="bg-surface-sunken rounded px-2 py-1.5">
                  <p className="text-ink-muted mb-1">Before</p>
                  <pre className="text-ink font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(decision.previous_value, null, 2)}
                  </pre>
                </div>
              )}
              {decision.new_value && (
                <div className="bg-brand-subtle/40 border border-brand/20 rounded px-2 py-1.5">
                  <p className="text-ink-muted mb-1">After</p>
                  <pre className="text-ink font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(decision.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {decision.applied_at && (
            <p className="text-xs text-ink-muted">
              Applied: {formatDateShort(new Date(decision.applied_at))}
            </p>
          )}
          {decision.notes && (
            <p className="text-xs text-ink-muted italic">{decision.notes}</p>
          )}

          {/* ── Follow-through management (accepted/applied only) ── */}
          {manageable && (
            <div className="space-y-3 pt-2 border-t border-edge-subtle">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-ink">Follow-through</p>
                {followThrough === 'not_started' ? (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleUpdate({ follow_through_status: 'completed' })}
                      disabled={actioning}
                      className="inline-flex min-h-11 items-center text-xs font-medium text-success hover:text-success/80 disabled:opacity-50"
                    >
                      Mark completed
                    </button>
                    <button
                      onClick={() => handleUpdate({ follow_through_status: 'abandoned' })}
                      disabled={actioning}
                      className="inline-flex min-h-11 items-center text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
                    >
                      Mark abandoned
                    </button>
                    <button
                      onClick={() => handleUpdate({ follow_through_status: 'not_applicable' })}
                      disabled={actioning}
                      className="inline-flex min-h-11 items-center text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
                    >
                      Not applicable
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">
                    {FOLLOW_THROUGH_LABELS[followThrough]}
                    {decision.completed_at &&
                      ` · ${formatDateShort(new Date(decision.completed_at))}`}
                  </p>
                )}
              </div>

              {/* Review date */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-ink">Review date</p>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="date"
                    value={reviewDateInput}
                    onChange={(e) => setReviewDateInput(e.target.value)}
                    className="px-2 py-1 rounded-md bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Review date"
                  />
                  <button
                    onClick={() => handleUpdate({ review_on: reviewDateInput })}
                    disabled={
                      actioning ||
                      !isReviewDateSaveable(decision.review_on ?? null, reviewDateInput)
                    }
                    className="inline-flex min-h-11 items-center text-xs font-medium text-brand hover:underline disabled:opacity-50"
                  >
                    Set review date
                  </button>
                  {decision.review_on && (
                    <button
                      onClick={() => {
                        setReviewDateInput(todayISO())
                        handleUpdate({ review_on: null })
                      }}
                      disabled={actioning}
                      className="inline-flex min-h-11 items-center text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Outcome — only once follow-through is recorded */}
              {isOutcomeEligible(followThrough) && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-ink">Outcome</p>
                  {outcome !== null && (
                    <p className="text-xs text-ink-muted">
                      {OUTCOME_LABELS[outcome]}
                      {decision.reviewed_at &&
                        ` · reviewed ${formatDateShort(new Date(decision.reviewed_at))}`}
                      {decision.outcome_notes && ` — ${decision.outcome_notes}`}
                    </p>
                  )}
                  <div className="space-y-2">
                    <select
                      value={outcomeInput}
                      onChange={(e) => setOutcomeInput(e.target.value as DecisionOutcome | '')}
                      className="w-full px-2 py-1.5 rounded-md bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="Outcome"
                    >
                      <option value="">Choose an outcome…</option>
                      {DECISION_OUTCOME_VALUES.map((value) => (
                        <option key={value} value={value}>
                          {OUTCOME_LABELS[value]}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={outcomeNotesInput}
                      onChange={(e) => setOutcomeNotesInput(e.target.value)}
                      maxLength={OUTCOME_NOTES_MAX_LENGTH}
                      rows={2}
                      placeholder="Optional note — what happened? (no need to explain why)"
                      className="w-full px-2 py-1.5 rounded-md bg-surface border border-edge text-ink text-xs placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="Outcome notes"
                    />
                    <button
                      onClick={() =>
                        handleUpdate({
                          outcome: outcomeInput,
                          outcome_notes: outcomeNotesInput,
                        })
                      }
                      disabled={actioning || outcomeInput === ''}
                      className="inline-flex min-h-11 items-center text-xs font-medium text-brand hover:underline disabled:opacity-50"
                    >
                      {outcome === null ? 'Record outcome' : 'Update outcome'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline error — prior card state stays intact */}
      {error && (
        <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1.5">{error}</p>
      )}

      {/* Accept / Dismiss actions */}
      {decision.status === 'suggested' && (
        <div className="flex gap-3 pt-1 border-t border-edge-subtle">
          <button
            onClick={() => handleUpdate({ status: 'accepted' })}
            disabled={actioning}
            className="flex items-center gap-1.5 text-sm font-medium text-success hover:text-success/80 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={() => handleUpdate({ status: 'dismissed' })}
            disabled={actioning}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
