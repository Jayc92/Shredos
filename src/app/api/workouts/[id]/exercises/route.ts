import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_MANUAL_SET_COUNT } from '@/lib/workout'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify session ownership (Phase 2I: also check completion status
  // in the same query, rather than adding a second lookup). Uses
  // maybeSingle() rather than single() so a genuinely-missing session
  // (data: null, error: null) is distinguishable from a real query
  // failure (error set) -- single() would return an error for BOTH
  // cases, which would have broken the original not-found -> 404
  // behavior once a fail-closed error check was added.
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions').select('id, status')
    .eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.status === 'completed') {
    return NextResponse.json(
      { error: 'Completed workouts are read-only. Reopen the workout before editing.' },
      { status: 409 }
    )
  }

  const body = await request.json()
  if (!body.exercise_id) return NextResponse.json({ error: 'exercise_id required' }, { status: 400 })

  // Determine next order_index
  const { data: existing } = await supabase
    .from('workout_exercises').select('order_index')
    .eq('workout_session_id', params.id)
    .order('order_index', { ascending: false }).limit(1).maybeSingle()
  const order_index = ((existing as any)?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_session_id: params.id,
      exercise_id: body.exercise_id,
      order_index,
      target_sets: body.target_sets ?? null,
      target_reps: body.target_reps ?? null,
      target_weight_kg: body.target_weight_kg ?? null,
    })
    .select('*, exercise:exercises(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Phase 5A.6A: a manually added exercise starts with default empty
  // entry rows instead of zero sets (three "Add set" taps). Same
  // persisted-draft semantics the routine-start flow has always used:
  // completed=false rows with every performance value NULL, so the
  // seeded rows carry no volume, history, PRs, or Coach facts until
  // the user actually completes them (all analytics filter on
  // completed && !is_warmup). All-NULL values are valid for every
  // tracking mode — nothing is prefilled. If a caller ever supplies a
  // prescribed target_sets (none does today; the routine flow has its
  // own route), that count is respected instead of the default.
  const seedCount =
    typeof body.target_sets === 'number' && Number.isInteger(body.target_sets) && body.target_sets > 0
      ? body.target_sets
      : DEFAULT_MANUAL_SET_COUNT
  const seedRows = Array.from({ length: seedCount }, (_, i) => ({
    workout_exercise_id: data.id,
    set_number: i + 1,
    completed: false,
    is_warmup: false,
    reps: null,
    weight_kg: null,
    rpe: null,
    duration_seconds: null,
    distance_meters: null,
    notes: null,
  }))
  const { error: seedError } = await supabase.from('workout_sets').insert(seedRows)
  if (seedError) {
    // Compensating cleanup: never leave a half-created exercise on the
    // workout. Deleting the new workout_exercises row cascades any
    // partially inserted sets (003 FK ON DELETE CASCADE). The session
    // and every other exercise/set are untouched.
    await supabase.from('workout_exercises').delete().eq('id', data.id)
    return NextResponse.json(
      { error: 'Could not add the exercise. Try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
