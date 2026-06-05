import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SavedMealUpdate } from '@/types/database'

/** PATCH /api/saved-meals/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch previous autopilot state for decision log
  const { data: prev } = await supabase
    .from('saved_meals')
    .select('name, is_autopilot')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  const body = await request.json() as SavedMealUpdate

  const { data, error } = await supabase
    .from('saved_meals')
    .update(body)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You already have a saved meal with this name.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log autopilot toggle decisions
  if (prev && body.is_autopilot !== undefined && body.is_autopilot !== prev.is_autopilot) {
    const mealName = data?.name ?? prev.name
    if (body.is_autopilot) {
      await supabase.from('decision_logs').insert({
        user_id: user.id,
        decision_type: 'autopilot_meal_added',
        decision_title: `${mealName} added as autopilot meal`,
        decision_summary: 'Meal will now appear prominently in Quick Add.',
        reason: 'User toggled is_autopilot on.',
        data_snapshot: { id: params.id, name: mealName },
        new_value: { is_autopilot: true },
        status: 'applied', created_by: 'user',
        applied_at: new Date().toISOString(),
      })
    } else {
      await supabase.from('decision_logs').insert({
        user_id: user.id,
        decision_type: 'autopilot_meal_removed',
        decision_title: `${mealName} removed from autopilot`,
        decision_summary: 'Meal will no longer appear at the top of Quick Add.',
        reason: 'User toggled is_autopilot off.',
        data_snapshot: { id: params.id, name: mealName },
        new_value: { is_autopilot: false },
        status: 'applied', created_by: 'user',
        applied_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ data })
}

/** DELETE /api/saved-meals/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('saved_meals')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
