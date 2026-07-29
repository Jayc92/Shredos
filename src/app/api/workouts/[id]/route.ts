import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockIfSessionCompleted } from '@/lib/supabase/workout-guards'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout_exercises(*, exercise:exercises(*), workout_sets(*))')
    .eq('id', params.id).eq('user_id', user.id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Phase 2I: a completed workout is read-only, including this generic
  // PATCH — it must not be usable to bypass the dedicated reopen route
  // (e.g. a PATCH body containing status: 'in_progress'). The ONLY
  // legal completed -> in_progress transition is POST
  // /api/workouts/[id]/reopen.
  const locked = await blockIfSessionCompleted(supabase, params.id, user.id)
  if (locked) return locked

  const body = await request.json()
  const { data, error } = await supabase
    .from('workout_sessions')
    .update(body)
    .eq('id', params.id).eq('user_id', user.id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
