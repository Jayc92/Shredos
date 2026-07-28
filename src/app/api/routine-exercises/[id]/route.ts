import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lbsToKg } from '@/lib/units'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  // target_weight_lbs is a UI-only field.
  // Convert it to the database's kg field when numeric, then always remove it
  // before passing the payload to Supabase.
  const update: Record<string, any> = { ...body }
  if (typeof body.target_weight_lbs === 'number') {
    update.target_weight_kg = body.target_weight_lbs > 0
      ? Math.round(lbsToKg(body.target_weight_lbs) * 100) / 100
      : null
  }

  delete update.target_weight_lbs
  const { data, error } = await supabase
    .from('workout_routine_exercises')
    .update(update)
    .eq('id', params.id)
    .select().single()
  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase
    .from('workout_routine_exercises').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
