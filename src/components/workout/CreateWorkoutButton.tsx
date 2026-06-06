'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

interface CreateWorkoutButtonProps {
  label?: string
}

export function CreateWorkoutButton({ label = 'New workout' }: CreateWorkoutButtonProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      const { data } = await res.json()
      router.push(`/workouts/${data.id}`)
    } else {
      setCreating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={creating}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      <Plus className="w-4 h-4" />
      {creating ? 'Starting…' : label}
    </button>
  )
}
