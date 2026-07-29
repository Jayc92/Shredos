'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatWorkoutDuration } from '@/lib/workout'
import { WORKOUT_STATUS_LABELS } from '@/lib/constants'
import { format, parseISO } from 'date-fns'
import { Check, Pencil, Trash2 } from 'lucide-react'
import type { WorkoutSession } from '@/types/database'

interface SessionHeaderProps {
  session: WorkoutSession; routineId?: string | null; routineName?: string | null
  onSessionDeleted?: () => void
}
export function SessionHeader({ session, routineId, routineName, onSessionDeleted }: SessionHeaderProps) {
  const router = useRouter()
  const [editingTitle,  setEditingTitle]  = useState(false)
  const [title,         setTitle]         = useState(session.title || 'Workout')
  const [completing,    setCompleting]    = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [reopening,     setReopening]     = useState(false)
  const [reopenError,   setReopenError]   = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)
  const dateLabel = format(parseISO(session.workout_date), 'EEEE, MMMM d')
  const duration  = formatWorkoutDuration(session.start_time, session.end_time)
  const isActive  = session.status === 'in_progress'
  const isDone    = session.status === 'completed'
  async function saveTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== session.title) {
      await fetch(`/api/workouts/${session.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: trimmed }) })
      router.refresh()
    }
    setEditingTitle(false)
  }
  async function handleComplete() {
    setCompleting(true); setCompleteError(null)
    try { const res = await fetch(`/api/workouts/${session.id}/complete`, { method: 'POST' }); if (!res.ok) throw new Error(''); router.refresh() }
    catch { setCompleteError('Could not save. Try again.') } finally { setCompleting(false) }
  }
  async function handleReopen() {
    if (!confirm('Reopen this workout for editing? Its completion time and summary will update when you complete it again.')) return
    setReopening(true); setReopenError(null)
    try { const res = await fetch(`/api/workouts/${session.id}/reopen`, { method: 'POST' }); if (!res.ok) throw new Error(''); router.refresh() }
    catch { setReopenError('Could not reopen. Try again.') } finally { setReopening(false) }
  }
  async function handleDelete() {
    const confirmMsg = isActive
      ? 'Delete this in-progress workout? All logged sets in this session will be permanently removed.'
      : 'Delete this workout? This cannot be undone.'
    if (!confirm(confirmMsg)) return
    setDeleting(true); setDeleteError(null)
    try {
      const res = await fetch(`/api/workouts/${session.id}`, { method: 'DELETE' })
      if (!res.ok) { const b = await res.json().catch(() => ({})); setDeleteError(b.error ?? 'Delete failed — please try again.'); setDeleting(false); return }
      onSessionDeleted?.()
    } catch { setDeleteError('Network error — please try again.'); setDeleting(false) }
  }
  return (
    <div className="shred-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
              className="flex-1 min-w-0 px-2 py-1 rounded-md bg-secondary border border-input text-foreground text-base font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={saveTitle} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setEditingTitle(true)} className="flex items-center gap-2 text-left flex-1 min-w-0 group">
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}
        <button onClick={handleDelete} disabled={deleting} title="Delete workout session" aria-label="Delete workout session"
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 disabled:opacity-40">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span>{dateLabel}</span>
        {duration && <span>{duration}</span>}
        {routineId && routineName && <a href={`/workouts/routines/${routineId}`} className="text-primary hover:underline flex-shrink-0">From: {routineName} →</a>}
        <span className={cn('rounded-full border px-2 py-0.5 font-medium',
          isDone ? 'bg-green-500/15 text-green-400 border-green-500/20' : isActive ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-secondary text-muted-foreground border-border')}>
          {WORKOUT_STATUS_LABELS[session.status] ?? session.status}
        </span>
      </div>
      {deleteError && <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{deleteError}</p>}
      {isActive && (
        <div className="space-y-2">
          <button onClick={handleComplete} disabled={completing}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {completing ? 'Saving…' : 'Complete workout'}
          </button>
          {completeError && <p className="text-xs text-destructive text-center">{completeError}</p>}
        </div>
      )}
      {isDone && (
        <div className="space-y-2">
          <button onClick={handleReopen} disabled={reopening}
            className="w-full py-2.5 rounded-lg border border-border text-muted-foreground font-medium text-sm hover:bg-secondary disabled:opacity-50 transition-colors">
            {reopening ? 'Reopening…' : 'Reopen workout'}
          </button>
          {reopenError && <p className="text-xs text-destructive text-center">{reopenError}</p>}
        </div>
      )}
    </div>
  )
}
