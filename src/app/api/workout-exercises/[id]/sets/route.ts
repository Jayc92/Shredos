import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockIfWorkoutExerciseCompleted } from '@/lib/supabase/workout-guards'
import type { TrackingMode } from '@/types/database'
import { buildSetInsert, mapWorkoutSetRpcError } from '@/lib/workout-set-contract'

// Phase 2S: the per-tracking-mode allowed field sets used to be duplicated
// in both workout-set routes (this file and workout-sets/[id]/route.ts)
// because that phase's approved scope locked to exactly those two files.
// W7 (weight_time coordinated plan) factors the whole per-mode contract —
// allowed fields, weight conversion, completion — into
// src/lib/workout-set-contract.ts: ONE implementation that both routes and
// the contract verifiers execute, so the two routes cannot drift apart.

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutExerciseCompleted(supabase, params.id, user.id)
  if (locked) return locked

  // Phase 2S: this workout_exercise's exercise tracking_mode determines
  // which fields are valid on the new set and how completion is
  // evaluated.
  const { data: we, error: weError } = await supabase
    .from('workout_exercises')
    .select('exercise:exercises ( tracking_mode )')
    .eq('id', params.id)
    .maybeSingle()
  if (weError) return NextResponse.json({ error: 'Could not read the exercise.' }, { status: 500 })
  const trackingMode: TrackingMode | undefined = (we as any)?.exercise?.tracking_mode
  if (!trackingMode) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  // The shared contract validates the body against the CURRENT mode and
  // builds the explicit, mode-correct payload (never a raw spread of body;
  // every mode-inapplicable field is explicitly null/false). For
  // weight_time, 0 lbs is a legal added-weight baseline and arrives here as
  // numeric 0, never null.
  const contract = buildSetInsert(trackingMode, body)
  if (!contract.ok) return NextResponse.json({ error: contract.error }, { status: contract.status })
  const insertPayload = contract.payload

  // Next set_number stays server-controlled — it is now computed by
  // append_workout_set (migration 021) INSIDE the shared numbering
  // lock, never here and never by the client.

  // UI-5B1B: the insert now goes through append_workout_set
  // (migration 021, weight_time branch in 028), which computes the next
  // set_number under the SAME per-exercise advisory lock as
  // delete-and-resequence — so add-after-delete always continues the
  // contiguous sequence and concurrent add/delete cannot duplicate or gap
  // numbers. Security-review correction: the function takes explicit
  // TYPED parameters (never a JSONB blob), re-derives the tracking mode
  // from the caller's own exercise row under FOR UPDATE, and re-validates
  // every field itself — a direct RPC caller gets exactly the same
  // contract this route enforces above.
  const { data, error } = await supabase.rpc('append_workout_set', {
    p_workout_exercise_id: params.id,
    p_reps: insertPayload.reps,
    p_weight_kg: insertPayload.weight_kg,
    p_rpe: insertPayload.rpe,
    p_duration_seconds: insertPayload.duration_seconds,
    p_distance_meters: insertPayload.distance_meters,
    p_completed: insertPayload.completed,
    p_is_warmup: insertPayload.is_warmup,
    p_notes: insertPayload.notes,
  })
  if (error) {
    const mapped = mapWorkoutSetRpcError(error.message ?? '')
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    return NextResponse.json({ error: 'Could not add the set.' }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
