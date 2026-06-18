import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('workout_routines')
    .select('*, workout_routine_exercises(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const { data, error } = await supabase
    .from('workout_routines')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      goal: body.goal ?? null,
      primary_muscle_focus: body.primary_muscle_focus ?? null,
      difficulty: body.difficulty ?? null,
      estimated_duration_minutes: body.estimated_duration_minutes ?? null,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A routine with this name already exists.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
