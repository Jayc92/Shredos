import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Verify routine ownership
  const { data: routine } = await supabase
    .from('workout_routines').select('id')
    .eq('id', params.id).eq('user_id', user.id).single()
  if (!routine) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  if (!body.exercise_id) return NextResponse.json({ error: 'exercise_id required' }, { status: 400 })
  // Next order_index
  const { data: last } = await supabase
    .from('workout_routine_exercises').select('order_index')
    .eq('routine_id', params.id)
    .order('order_index', { ascending: false }).limit(1).maybeSingle()
  const order_index = ((last as any)?.order_index ?? -1) + 1
  const { data, error } = await supabase
    .from('workout_routine_exercises')
    .insert({
      routine_id: params.id,
      exercise_id: body.exercise_id,
      order_index,
      target_sets: body.target_sets ?? null,
      target_reps_min: body.target_reps_min ?? null,
      target_reps_max: body.target_reps_max ?? null,
      target_weight_kg: body.target_weight_kg ?? null,
      target_rpe: body.target_rpe ?? null,
      rest_seconds: body.rest_seconds ?? null,
    })
    .select('*, exercise:exercises(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
