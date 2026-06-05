import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SavedMealInsert } from '@/types/database'

/** GET /api/saved-meals */
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_meals')
    .select('*')
    .eq('user_id', user.id)
    .order('is_autopilot', { ascending: false })
    .order('use_count', { ascending: false })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

/** POST /api/saved-meals */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as Partial<SavedMealInsert>

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (body.calories === undefined || body.calories < 0) {
    return NextResponse.json({ error: 'calories must be >= 0' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('saved_meals')
    .insert({
      user_id:            user.id,
      name:               body.name.trim(),
      meal_type_default:  body.meal_type_default ?? null,
      calories:           body.calories,
      protein_g:          body.protein_g ?? 0,
      carbs_g:            body.carbs_g   ?? 0,
      fat_g:              body.fat_g     ?? 0,
      fiber_g:            body.fiber_g   ?? null,
      sugar_g:            body.sugar_g   ?? null,
      sodium_mg:          body.sodium_mg ?? null,
      items:              body.items     ?? [],
      is_autopilot:       body.is_autopilot ?? false,
      notes:              body.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation (duplicate name per user)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You already have a saved meal with this name.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log decision if autopilot was enabled
  if (data.is_autopilot) {
    await supabase.from('decision_logs').insert({
      user_id:          user.id,
      decision_type:    'autopilot_meal_added',
      decision_title:   `${data.name} added as autopilot meal`,
      decision_summary: 'Saved as an autopilot meal. It will appear prominently in Quick Add.',
      reason:           'User marked this meal as autopilot during creation.',
      data_snapshot:    { calories: data.calories, protein_g: data.protein_g, carbs_g: data.carbs_g, fat_g: data.fat_g },
      new_value:        { name: data.name, is_autopilot: true },
      status:           'applied',
      created_by:       'user',
      applied_at:       new Date().toISOString(),
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}
