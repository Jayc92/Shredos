'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

async function fetchRoutines() {
  const res = await fetch('/api/routines')
  if (!res.ok) throw new Error('Failed to fetch routines')
  const json = await res.json()
  return json.data ?? []
}

export function useRoutines() {
  return useQuery({ queryKey: ['routines'], queryFn: fetchRoutines })
}

export function useCreateRoutine() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to create routine')
      }
      return res.json()
    },
    onSuccess: (json) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      if (json.data?.id) router.push(`/workouts/routines/${json.data.id}`)
    },
  })
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Record<string, any>) => {
      const res = await fetch(`/api/routines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to update routine')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      router.refresh()
    },
  })
}

export function useStartRoutine() {
  const router = useRouter()
  return useMutation({
    mutationFn: async (routineId: string) => {
      const workout_date = new Date().toLocaleDateString('en-CA')
      const res = await fetch(`/api/routines/${routineId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout_date }),
      })
      if (!res.ok) throw new Error('Failed to start workout')
      return res.json()
    },
    onSuccess: (json) => {
      if (json.data?.session_id) router.push(`/workouts/${json.data.session_id}`)
    },
  })
}
