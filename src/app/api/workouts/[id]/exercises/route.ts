import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  return NextResponse.json({ data }, { status: 201 })
}
