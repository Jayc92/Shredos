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
  session: WorkoutSession
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const router = useRouter()
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle]               = useState(session.title || 'Workout')
  const [completing, setCompleting]     = useState(false)
  const [deleting, setDeleting]         = useState(false)

  const dateLabel  = format(parseISO(session.workout_date), 'EEEE, MMMM d')
  const duration   = formatWorkoutDuration(session.start_time, session.end_time)
  const isActive   = session.status === 'in_progress'
  const isDone     = session.status === 'completed'

  async function saveTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== session.title) {
      await fetch(`/api/workouts/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      router.refresh()
    }
    setEditingTitle(false)
  }

  async function handleComplete() {
    setCompleting(true)
    await fetch(`/api/workouts/${session.id}/complete`, { method: 'POST' })
    router.refresh()
    setCompleting(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this entire workout? All sets will be lost.')) return
    setDeleting(true)
    await fetch(`/api/workouts/${session.id}`, { method: 'DELETE' })
    router.push('/workouts')
  }

  return (
    <div className="shred-card space-y-3">
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
              className="flex-1 min-w-0 px-2 py-1 rounded-md bg-secondary border border-input text-foreground text-base font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={saveTitle} className="text-green-400 hover:text-green-300">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingTitle(true)}
            className="flex items-center gap-2 text-left flex-1 min-w-0 group">
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}
        <button onClick={handleDelete} disabled={deleting}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 disabled:opacity-40"
          aria-label="Delete workout">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span>{dateLabel}</span>
        {duration && <span>{duration}</span>}
        <span className={cn(
          'rounded-full border px-2 py-0.5 font-medium',
          isDone ? 'bg-green-500/15 text-green-400 border-green-500/20' :
          isActive ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
          'bg-secondary text-muted-foreground border-border'
        )}>
          {WORKOUT_STATUS_LABELS[session.status] ?? session.status}
        </span>
      </div>

      {/* Complete button */}
      {isActive && (
        <button onClick={handleComplete} disabled={completing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {completing ? 'Saving…' : 'Complete workout'}
        </button>
      )}
    </div>
  )
}
