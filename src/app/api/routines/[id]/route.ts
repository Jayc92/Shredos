import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('workout_routines')
    .select('*, workout_routine_exercises(*, exercise:exercises(*))')
    .eq('id', params.id).eq('user_id', user.id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (Array.isArray((data as any).workout_routine_exercises)) {
    (data as any).workout_routine_exercises.sort((a: any, b: any) => a.order_index - b.order_index)
  }
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase
    .from('workout_routines')
    .update(body)
    .eq('id', params.id).eq('user_id', user.id)
    .select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A routine with this name already exists.' }, { status: 409 })
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Block hard delete if sessions reference this routine
  const { count } = await supabase
    .from('workout_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('routine_id', params.id)
  if (count && count > 0) {
    return NextResponse.json({
      error: 'This routine has been used in workouts. Deactivate it instead of deleting.',
      has_sessions: true,
    }, { status: 409 })
  }
  const { error } = await supabase
    .from('workout_routines').delete().eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
