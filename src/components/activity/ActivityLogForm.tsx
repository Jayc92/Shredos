'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DailyActivityLog } from '@/types/database'

interface ActivityLogFormProps {
  date: string
  existingLog: DailyActivityLog | null
  isFutureDate: boolean
}

export function ActivityLogForm({ date, existingLog, isFutureDate }: ActivityLogFormProps) {
  const router = useRouter()
  const [steps, setSteps] = useState(existingLog ? String(existingLog.steps) : '')
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        steps: steps === '' ? 0 : Number(steps),
        notes: notes || null,
      }),
    })

    setSaving(false)

    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save steps. Try again.')
    }
  }

  return (
    <div className="shred-card space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground" htmlFor="steps-input">
          Steps
        </label>
        <input
          id="steps-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={100000}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          disabled={isFutureDate}
          placeholder="0"
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-foreground text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground" htmlFor="activity-notes-input">
          Notes (optional)
        </label>
        <input
          id="activity-notes-input"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isFutureDate}
          placeholder="Long walk, rest day, etc."
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {isFutureDate ? (
        <p className="text-xs text-muted-foreground">Can’t log steps for a future date.</p>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : existingLog ? 'Update steps' : 'Save steps'}
        </button>
      )}
    </div>
  )
}
