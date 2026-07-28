import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSessionTitle } from '@/lib/routine'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const workout_date = body.workout_date ?? new Date().toISOString().split('T')[0]

  const { data: routine, error: rErr } = await supabase
    .from('workout_routines')
    .select('*, workout_routine_exercises(*, exercise:exercises(id, name, unilateral))')
    .eq('id', params.id).eq('user_id', user.id).single()

  if (rErr || !routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 })

  if (!(routine as any).is_active) {
    return NextResponse.json(
      { error: 'This routine is inactive. Reactivate it before starting a workout.' },
      { status: 409 }
    )
  }

  const routineExercises: any[] = ((routine as any).workout_routine_exercises ?? [])
    .slice().sort((a: any, b: any) => a.order_index - b.order_index)

  /** Delete the session so CASCADE removes all child rows. */
  async function cleanup(sid: string) {
    await supabase.from('workout_sessions').delete().eq('id', sid)
  }

  const { data: session, error: sErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id:    user.id, workout_date,
      title:      buildSessionTitle((routine as any).name, workout_date),
      status:     'in_progress',
      start_time: new Date().toISOString(),
      routine_id: (routine as any).id,
    })
    .select('id').single()

  if (sErr || !session) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })

  const sessionId: string = (session as any).id

  if (routineExercises.length > 0) {
    const exerciseRows = routineExercises.map((re: any) => ({
      workout_session_id: sessionId,
      exercise_id:        re.exercise_id,
      order_index:        re.order_index,
      target_sets:        re.target_sets      ?? null,
      target_reps:        re.target_reps_max  ?? re.target_reps_min ?? null,
      target_reps_min:    re.target_reps_min  ?? null,
      target_reps_max:    re.target_reps_max  ?? null,
      target_weight_kg:   re.target_weight_kg ?? null,
    }))

    const { data: createdExercises, error: weErr } = await supabase
      .from('workout_exercises').insert(exerciseRows).select('id, order_index')

    if (weErr || !createdExercises || createdExercises.length === 0) {
      await cleanup(sessionId)
      return NextResponse.json(
        { error: 'Failed to copy exercises — no session was created. Please try again.' },
        { status: 500 }
      )
    }

    const allSets: Array<Record<string, unknown>> = []
    for (const re of routineExercises) {
      if (!re.target_sets || re.target_sets <= 0) continue
      const we = (createdExercises as any[]).find(c => c.order_index === re.order_index)
      if (!we) continue
      for (let i = 0; i < re.target_sets; i++) {
        allSets.push({
          workout_exercise_id: we.id,
          set_number: i + 1,
          weight_kg:  re.target_weight_kg ?? null,
          reps:       null,
          completed:  false,
          is_warmup:  false,
        })
      }
    }

    if (allSets.length > 0) {
      const { error: setsErr } = await supabase.from('workout_sets').insert(allSets)
      if (setsErr) {
        // M1 CORRECTED: set failure is fatal.
        // Delete the session — CASCADE removes copied exercises and any partial sets.
        // Do not return 201. Do not redirect user into an incomplete workout.
        await cleanup(sessionId)
        return NextResponse.json(
          { error: 'Failed to create pre-filled sets — no session was created. Please try again.' },
          { status: 500 }
        )
      }
    }
  }

  return NextResponse.json({ data: { session_id: sessionId } }, { status: 201 })
}
