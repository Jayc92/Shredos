'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RecordDecisionButtonProps {
  decisionType: string
  title: string
  reason: string
}

export function RecordDecisionButton({
  decisionType,
  title,
  reason,
}: RecordDecisionButtonProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleRecord() {
    setStatus('saving')
    const res = await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision_type: decisionType,
        decision_title: title,
        decision_summary: reason,
        reason,
        status: 'suggested',
        created_by: 'coach',
      }),
    })
    if (res.ok) {
      setStatus('saved')
      router.refresh()
    } else {
      setStatus('error')
    }
  }

  if (status === 'saved') {
    return (
      <p className="text-xs text-muted-foreground">
        Recorded as a suggested decision.{' '}
        <Link href="/decisions" className="text-primary hover:underline">
          Review it
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleRecord}
        disabled={status === 'saving'}
        className="text-xs px-3 py-1.5 rounded-lg border border-input bg-secondary hover:bg-secondary/70 text-foreground font-medium disabled:opacity-50 transition-colors"
      >
        {status === 'saving' ? 'Recording…' : 'Record this decision'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400">Couldn’t record that. Try again.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Saved as a suggested decision you can accept or dismiss later — nothing changes automatically.
      </p>
    </div>
  )
}
