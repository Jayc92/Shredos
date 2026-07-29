import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lbsToKg } from '@/lib/units'
import { blockIfWorkoutExerciseCompleted } from '@/lib/supabase/workout-guards'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutExerciseCompleted(supabase, params.id, user.id)
  if (locked) return locked

  const body = await request.json().catch(() => ({}))

  // Next set_number
  const { data: lastSet } = await supabase
    .from('workout_sets').select('set_number')
    .eq('workout_exercise_id', params.id)
    .order('set_number', { ascending: false }).limit(1).maybeSingle()
  const set_number = ((lastSet as any)?.set_number ?? 0) + 1

  // Accept weight_lbs (client standard) or weight_kg (internal override)
  let weight_kg: number | null = null
  if (typeof body.weight_lbs === 'number' && body.weight_lbs > 0) {
    weight_kg = Math.round(lbsToKg(body.weight_lbs) * 100) / 100
  } else if (typeof body.weight_kg === 'number') {
    weight_kg = body.weight_kg
  }

  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      workout_exercise_id: params.id,
      set_number,
      weight_kg,
      reps: body.reps ?? null,
      rpe: body.rpe ?? null,
      completed: body.completed ?? false,
      is_warmup: body.is_warmup ?? false,
      notes: body.notes ?? null,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
