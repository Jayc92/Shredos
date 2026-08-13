'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================
// ForgeFitOS — "Finished logging today" (Phase 5B.2)
//
// A restrained data-quality affordance, not a celebration
// mechanic: one explicit tap tells the adaptive energy model this
// day's logging is complete (nutrition_day_status row). Undo is a
// single tap with no confirmation — absence of the row simply
// returns the day to "unknown". Works on any selected local date,
// today or historical. Editing food afterwards deliberately does
// NOT clear the mark (completion means "I consider this day
// finished"); the energy facts always recompute actual current
// intake from food_logs.
// ============================================================

interface DayCompleteToggleProps {
  date: string
  initialComplete: boolean
}

export function DayCompleteToggle({ date, initialComplete }: DayCompleteToggleProps) {
  const router = useRouter()
  const [complete, setComplete] = useState(initialComplete)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function markComplete() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/nutrition/day-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not mark the day complete. Try again.')
        setSaving(false)
        return
      }
      setComplete(true)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
      setSaving(false)
    }
  }

  async function undoComplete() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/nutrition/day-status?date=${date}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not undo. Try again.')
        setSaving(false)
        return
      }
      setComplete(false)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
      setSaving(false)
    }
  }

  return (
    <Card variant="subtle" className="gap-0 py-3">
      <CardContent className="space-y-2">
        {complete ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm text-ink">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
              Day marked complete
            </p>
            <button
              type="button"
              onClick={undoComplete}
              disabled={saving}
              className="text-xs text-ink-muted hover:text-ink underline disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {saving ? 'Saving…' : 'Undo'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Finished logging?</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Marking the day complete improves your energy trend accuracy.
              </p>
            </div>
            <button
              type="button"
              onClick={markComplete}
              disabled={saving}
              className="px-3 py-2 min-h-9 rounded-[var(--radius-control)] border border-edge text-xs font-medium text-ink hover:bg-surface-sunken disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {saving ? 'Saving…' : 'Mark day complete'}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-critical">{error}</p>}
      </CardContent>
    </Card>
  )
}
