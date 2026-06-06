import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoTitle } from '@/lib/workout'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20')
  const { data } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const workout_date = body.workout_date ?? new Date().toISOString().split('T')[0]
  const title = body.title?.trim() || autoTitle(workout_date)
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      workout_date,
      title,
      status: 'in_progress',
      start_time: new Date().toISOString(),
      notes: body.notes ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
