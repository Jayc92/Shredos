import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lbsToKg } from '@/lib/units'
import { blockIfWorkoutExerciseCompleted } from '@/lib/supabase/workout-guards'

// ============================================================
// ForgeFitOS — Workout exercise PATCH/DELETE (UI-5B1B hardening)
// The PATCH previously forwarded the raw body into .update(). It now
// enforces a strict prescription/annotation allowlist: unknown keys
// are rejected with 400 (never silently forwarded), order_index is
// deliberately NOT accepted here (reordering has its own
// transactional route), and identity/ownership/foreign-key/history
// columns are unreachable. Weight arrives in lbs and is converted
// server-side to stored kilograms, matching the routine route.
// ============================================================

const ALLOWED_KEYS = new Set([
  'target_sets', 'target_reps_min', 'target_reps_max', 'target_weight_lbs', 'notes',
])

function isNullableInt(v: unknown, min: number, max: number): boolean {
  return v === null || (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutExerciseCompleted(supabase, params.id, user.id)
  if (locked) return locked

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected an object body.' }, { status: 400 })
  }

  const unsupported = Object.keys(body).filter((key) => !ALLOWED_KEYS.has(key))
  if (unsupported.length > 0) {
    return NextResponse.json(
      { error: 'Only prescription and note fields can be updated here.' },
      { status: 400 }
    )
  }

  const update: Record<string, unknown> = {}
  if ('target_sets' in body) {
    if (!isNullableInt(body.target_sets, 1, 100)) {
      return NextResponse.json({ error: 'target_sets must be a positive integer.' }, { status: 400 })
    }
    update.target_sets = body.target_sets
  }
  if ('target_reps_min' in body) {
    if (!isNullableInt(body.target_reps_min, 0, 1000)) {
      return NextResponse.json({ error: 'target_reps_min must be a non-negative integer.' }, { status: 400 })
    }
    update.target_reps_min = body.target_reps_min
  }
  if ('target_reps_max' in body) {
    if (!isNullableInt(body.target_reps_max, 0, 1000)) {
      return NextResponse.json({ error: 'target_reps_max must be a non-negative integer.' }, { status: 400 })
    }
    update.target_reps_max = body.target_reps_max
  }
  if ('target_weight_lbs' in body) {
    const lbs = body.target_weight_lbs
    if (lbs !== null && typeof lbs !== 'number') {
      return NextResponse.json({ error: 'target_weight_lbs must be a number.' }, { status: 400 })
    }
    update.target_weight_kg = typeof lbs === 'number' && lbs > 0
      ? Math.round(lbsToKg(lbs) * 100) / 100
      : null
  }
  if ('notes' in body) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return NextResponse.json({ error: 'notes must be text.' }, { status: 400 })
    }
    update.notes = body.notes
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  // RLS handles ownership via session subquery
  const { data, error } = await supabase
    .from('workout_exercises').update(update)
    .eq('id', params.id).select().single()
  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Could not save the exercise.' }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutExerciseCompleted(supabase, params.id, user.id)
  if (locked) return locked

  const { error } = await supabase
    .from('workout_exercises').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Could not remove the exercise.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
