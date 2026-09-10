import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockIfWorkoutSetCompleted } from '@/lib/supabase/workout-guards'
import type { TrackingMode } from '@/types/database'
import { buildSetPatch } from '@/lib/workout-set-contract'
import type { ExistingSetRow } from '@/lib/workout-set-contract'

// Phase 2S: see the matching comment in
// workout-exercises/[id]/sets/route.ts. W7 moved the per-mode contract
// into src/lib/workout-set-contract.ts, shared by both routes.

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutSetCompleted(supabase, params.id, user.id)
  if (locked) return locked

  // Phase 2S: fetch the existing set plus its exercise's current
  // tracking_mode before validating anything. A partial PATCH (e.g.
  // just {completed: true}) can only be validated correctly against
  // the FINAL merged state, not the request body in isolation.
  const { data: existing, error: fetchError } = await supabase
    .from('workout_sets')
    .select(`
      reps, weight_kg, rpe, is_warmup, completed, duration_seconds, distance_meters,
      workout_exercise:workout_exercises ( exercise:exercises ( tracking_mode ) )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: 'Could not read the set.' }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const trackingMode: TrackingMode | undefined =
    (existing as any).workout_exercise?.exercise?.tracking_mode
  if (!trackingMode) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  // W7 — DATA-INTEGRITY RULE (plan §5.2): the update contains ONLY the
  // fields this request legitimately supplied for the exercise's CURRENT
  // mode, validated against the FINAL merged state. The pre-W7 "self-heal"
  // that nulled any stored dimension left over from a prior tracking mode
  // — even when the request never touched it — is gone: stored history is
  // preserved exactly, and a mode change on an exercise that has sets is
  // refused at the database instead (migration 028's history guard).
  const contract = buildSetPatch(trackingMode, existing as unknown as ExistingSetRow, body)
  if (!contract.ok) return NextResponse.json({ error: contract.error }, { status: contract.status })

  const { data, error } = await supabase
    .from('workout_sets').update(contract.update)
    .eq('id', params.id).select().single()
  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Could not save the set.' }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutSetCompleted(supabase, params.id, user.id)
  if (locked) return locked

  // UI-5B1B: delete and resequence commit in ONE transaction
  // (migration 021). The remaining sets renumber contiguously to
  // 1..N with ids, values, nulls, completion, warmup, and notes
  // untouched; no partial delete-without-resequence state can ever
  // commit, and success is only returned after both have committed.
  // The function re-checks ownership and the completed-workout lock
  // fail-closed, on top of the route guard above.
  const { data, error } = await supabase.rpc('delete_workout_set_and_resequence', {
    p_set_id: params.id,
  })
  if (error) {
    const message = error.message ?? ''
    if (message.includes('not_found')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (message.includes('workout_completed')) {
      return NextResponse.json(
        { error: 'Completed workouts are read-only. Reopen the workout before editing.' },
        { status: 409 }
      )
    }
    if (message.includes('invalid_input')) {
      return NextResponse.json({ error: 'Invalid set.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Could not delete the set.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}
