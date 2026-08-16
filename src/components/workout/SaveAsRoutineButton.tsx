'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkPlus } from 'lucide-react'

// ============================================================
// ForgeFitOS — Save workout as routine (UI-5B2)
// Available on live AND completed workouts. Opens an accessible
// naming dialog (required name prefilled from the workout title,
// optional description, honest copy summary), POSTs to the
// save-as-routine route (which calls only the migration 022 RPC),
// and navigates to the new routine's detail page for review and
// editing. Duplicate names come back as inline 409 feedback; every
// failure preserves the dialog contents so nothing retypes.
// ============================================================

interface SaveAsRoutineButtonProps {
  workoutId: string
  workoutTitle: string
}

export function SaveAsRoutineButton({ workoutId, workoutTitle }: SaveAsRoutineButtonProps) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(workoutTitle)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    // Reopen fresh only when there is no preserved failure state.
    if (error === null) setName(workoutTitle)
    setOpen(true)
  }

  function handleCancel() {
    if (saving) return
    setOpen(false)
  }

  async function handleSave() {
    // pendingRef flips synchronously before any await, so a
    // double-click can never start a second request.
    if (pendingRef.current || saving) return
    if (name.trim().length === 0) {
      setError('A routine name is required.')
      return
    }
    pendingRef.current = true
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/workouts/${workoutId}/save-as-routine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.data?.routine_id) {
        router.push(`/workouts/routines/${body.data.routine_id}`)
        return
      }
      // 409 duplicate name and every other failure land here: the
      // dialog stays open with its contents intact.
      setError(body.error ?? 'Could not save the routine.')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
      pendingRef.current = false
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex min-h-11 items-center gap-2 rounded-lg border border-edge px-4 text-sm font-medium text-ink hover:border-ink-muted transition-colors"
      >
        <BookmarkPlus className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        Save as routine
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-as-routine-title"
        >
          <div
            className="relative z-[60] isolate w-full max-w-sm rounded-xl border border-black/20 p-5 shadow-2xl ring-1 ring-black/10 space-y-4 !bg-white !text-black"
            style={{
              background: '#ffffff', backgroundColor: '#ffffff', color: '#111111',
              opacity: 1, mixBlendMode: 'normal', backdropFilter: 'none',
            }}
          >
            <div>
              <h2 id="save-as-routine-title" className="text-sm font-semibold text-black">
                Save as routine
              </h2>
              <p className="text-xs text-neutral-700 mt-1.5">
                Copies this workout&apos;s exercise structure, order, explicit
                targets, and set counts into a reusable routine — never your
                logged performance or notes.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-neutral-800" htmlFor="save-as-routine-name">
                Routine name
              </label>
              <input
                id="save-as-routine-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
                aria-required="true"
                className="w-full min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
              <label className="block text-xs font-medium text-neutral-800" htmlFor="save-as-routine-description">
                Description (optional)
              </label>
              <textarea
                id="save-as-routine-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={2}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-700 bg-red-50 rounded px-2 py-1.5" aria-live="polite">
                {error}
              </p>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full min-h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save routine'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="w-full min-h-11 rounded-lg text-sm text-neutral-600 hover:text-black disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
