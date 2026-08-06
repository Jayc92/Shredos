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
      <p className="text-xs text-ink-muted">
        Recorded as a suggested decision.{' '}
        <Link href="/decisions" className="text-brand hover:underline">
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
        className="text-xs px-3 py-1.5 rounded-[var(--radius-control)] border border-edge bg-surface hover:bg-surface-interactive text-ink font-medium disabled:opacity-50 transition-colors"
      >
        {status === 'saving' ? 'Recording…' : 'Record this decision'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-critical">Couldn’t record that. Try again.</p>
      )}
      <p className="text-xs text-ink-muted">
        Saved as a suggested decision you can accept or dismiss later — nothing changes automatically.
      </p>
    </div>
  )
}
