'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { Exercise } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────

export interface CreateExercisePayload {
  name: string
  category?: string | null
  primary_muscle: string
  secondary_muscles?: string[]
  equipment?: string | null
  exercise_type: string
  unilateral?: boolean
  notes?: string | null
}

export interface UpdateExercisePayload extends Partial<CreateExercisePayload> {
  is_active?: boolean
}

// ── Fetcher ───────────────────────────────────────────────────────

async function fetchExercises(): Promise<Exercise[]> {
  const res = await fetch('/api/exercises')
  if (!res.ok) throw new Error('Failed to fetch exercises')
  const json = await res.json()
  return json.data ?? []
}

// ── Hooks ─────────────────────────────────────────────────────────

/** All active exercises for the current user. */
export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
  })
}

/** Create a new exercise. */
export function useCreateExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateExercisePayload) => {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to create exercise')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

/** Update an exercise (name, fields, is_active). */
export function useUpdateExercise() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateExercisePayload & { id: string }) => {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to update exercise')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      router.refresh()
    },
  })
}

/** Deactivate an exercise (soft delete). */
export function useDeactivateExercise() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      })
      if (!res.ok) throw new Error('Failed to deactivate exercise')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      router.refresh()
    },
  })
}
