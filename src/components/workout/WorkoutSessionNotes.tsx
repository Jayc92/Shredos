'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkoutStatus } from '@/types/database'

// Phase 2N: must match WORKOUT_NOTES_MAX_LENGTH in
// src/app/api/workouts/[id]/route.ts. Kept as an independent literal
// here rather than importing from that route module — a route file
// pulls in server-only imports (next/server, createClient) that
// shouldn't be dragged into a client component's bundle.
const NOTES_MAX_LENGTH = 2000

interface WorkoutSessionNotesProps {
  sessionId: string
  notes: string | null
  status: WorkoutStatus
}

/**
 * Workout-level session notes (Phase 2N) — distinct from exercise-
 * level notes, which this component has no involvement with. Editable
 * only while the session is genuinely in progress (true active or a
 * Phase 2I correction — both share status='in_progress', and both get
 * identical notes behavior here); read-only for completed and skipped
 * sessions.
 *
 * Manual Save/Cancel only, matching the same interaction pattern
 * SessionHeader.tsx's title editing already established — no
 * autosave, no optimistic local mutation. A successful save calls
 * router.refresh(), the same convention every other mutation in this
 * app already uses.
 */
export function WorkoutSessionNotes({ sessionId, notes, status }: WorkoutSessionNotesProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditable = status === 'in_progress'
  const trimmedNotes = notes?.trim() ?? ''

  function startEditing() {
    setDraft(notes ?? '')
    setError(null)
    setEditing(true)
  }

  function handleCancel() {
    setDraft(notes ?? '')
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/workouts/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: draft }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Could not save workout notes. Please try again.')
        setSaving(false)
        return
      }
      setEditing(false)
      setSaving(false)
      router.refresh()
    } catch {
      setError('Could not save workout notes. Please try again.')
      setSaving(false)
    }
  }

  // Read-only, empty: render nothing at all for a completed/skipped
  // session with no notes, rather than an empty historical card.
  if (!isEditable && trimmedNotes.length === 0) {
    return null
  }

  // Read-only, has notes: plain display, no edit affordance.
  if (!isEditable) {
    return (
      <div className="shred-card space-y-1.5">
        <h2 className="text-sm font-semibold text-foreground">Session notes</h2>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trimmedNotes}</p>
      </div>
    )
  }

  // Editable, not currently editing: show existing notes (if any) or
  // an "Add session notes" prompt, both leading into the same editor.
  if (!editing) {
    return (
      <div className="shred-card space-y-1.5">
        <h2 className="text-sm font-semibold text-foreground">Session notes</h2>
        {trimmedNotes.length > 0 ? (
          <>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trimmedNotes}</p>
            <button
              type="button"
              onClick={startEditing}
              className="text-xs text-primary hover:underline"
            >
              Edit notes
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="text-sm text-muted-foreground hover:text-foreground text-left transition-colors"
          >
            + Add session notes
          </button>
        )}
      </div>
    )
  }

  // Editing.
  const remaining = NOTES_MAX_LENGTH - draft.length
  const overLimit = draft.trim().length > NOTES_MAX_LENGTH

  return (
    <div className="shred-card space-y-2">
      <div>
        <label htmlFor="workout-notes-textarea" className="text-sm font-semibold text-foreground">
          Workout notes
        </label>
        <textarea
          id="workout-notes-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Energy, pain, substitutions, or anything to remember next time."
          maxLength={NOTES_MAX_LENGTH + 200}
          rows={4}
          className="mt-1.5 w-full px-3 py-2 rounded-md bg-secondary border border-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
        />
        <p
          className={`text-xs mt-1 ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {draft.length} / {NOTES_MAX_LENGTH}
        </p>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || overLimit}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
