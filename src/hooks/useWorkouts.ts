'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────

interface CreateSessionPayload {
  workout_date?: string   // ISO date; defaults to today on server
  title?: string
}

// ── Fetchers ──────────────────────────────────────────────────────

async function fetchSessions() {
  const res = await fetch('/api/workouts')
  if (!res.ok) throw new Error('Failed to fetch sessions')
  const json = await res.json()
  return json.data ?? []
}

async function fetchSession(id: string) {
  const res = await fetch(`/api/workouts/${id}`)
  if (!res.ok) throw new Error('Failed to fetch session')
  const json = await res.json()
  return json.data ?? null
}

// ── Hooks ─────────────────────────────────────────────────────────

export function useWorkouts() {
  return useQuery({
    queryKey: ['workout-sessions'],
    queryFn: fetchSessions,
  })
}

export function useWorkoutSession(id: string) {
  return useQuery({
    queryKey: ['workout-session', id],
    queryFn: () => fetchSession(id),
    enabled: Boolean(id),
  })
}

export function useCreateWorkout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (payload: CreateSessionPayload = {}) => {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to create workout')
      }
      return res.json()
    },
    onSuccess: (json) => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] })
      if (json.data?.id) {
        router.push(`/workouts/${json.data.id}`)
      }
    },
  })
}

export function useCompleteWorkout(sessionId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workouts/${sessionId}/complete`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to complete workout')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['workout-session', sessionId] })
      router.refresh()
    },
  })
}

export function useUpdateWorkout(sessionId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/workouts/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update workout')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['workout-session', sessionId] })
      router.refresh()
    },
  })
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/workouts/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete workout')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] })
      router.push('/workouts')
    },
  })
}

export function useAddExerciseToSession(sessionId: string) {
  const router = useRouter()

  return useMutation({
    mutationFn: async (exerciseId: string) => {
      const res = await fetch(`/api/workouts/${sessionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: exerciseId }),
      })
      if (!res.ok) throw new Error('Failed to add exercise')
      return res.json()
    },
    onSuccess: () => {
      router.refresh()
    },
  })
}
