import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSessionTitle } from '@/lib/routine'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  // Q1 approved: client sends local date via toLocaleDateString('en-CA')
  const workout_date = body.workout_date ?? new Date().toISOString().split('T')[0]

  // Fetch routine + exercises (RLS enforces ownership)
  const { data: routine, error: rErr } = await supabase
    .from('workout_routines')
    .select('*, workout_routine_exercises(*, exercise:exercises(id, name, unilateral))')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (rErr || !routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 })

  const routineExercises = ((routine as any).workout_routine_exercises ?? [])
    .sort((a: any, b: any) => a.order_index - b.order_index)

  // Create workout session linked to this routine
  const { data: session, error: sErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      workout_date,
      title: buildSessionTitle(routine.name, workout_date),
      status: 'in_progress',
      start_time: new Date().toISOString(),
      routine_id: routine.id,
    })
    .select()
    .single()

  if (sErr || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Copy routine exercises into workout_exercises
  for (const re of routineExercises) {
    const { data: we, error: weErr } = await supabase
      .from('workout_exercises')
      .insert({
        workout_session_id: session.id,
        exercise_id: re.exercise_id,
        order_index: re.order_index,
        // Copy targets so session detail shows "Target: 3 × 8–12 · 185 lbs"
        target_sets: re.target_sets ?? null,
        target_reps: re.target_reps_max ?? re.target_reps_min ?? null,
        target_weight_kg: re.target_weight_kg ?? null,
      })
      .select()
      .single()

    if (weErr || !we) continue

    // Q1 approved: pre-create empty set rows if target_sets is set
    // Q8 approved: weight pre-filled from routine target, reps left null (blank)
    if (re.target_sets && re.target_sets > 0) {
      const emptysets = Array.from({ length: re.target_sets }, (_, idx) => ({
        workout_exercise_id: (we as any).id,
        set_number: idx + 1,
        weight_kg: re.target_weight_kg ?? null,
        reps: null,           // Q8: reps intentionally blank — user fills in actual reps
        completed: false,
        is_warmup: false,
      }))
      await supabase.from('workout_sets').insert(emptysets)
    }
  }

  return NextResponse.json({ data: { session_id: session.id } }, { status: 201 })
}
