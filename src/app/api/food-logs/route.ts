import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { localTodayFromCookies } from '@/lib/local-date-server'
import type { FoodLogInsert } from '@/types/database'

/** GET /api/food-logs?date=YYYY-MM-DD */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date param required' }, { status: 400 })

  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('logged_date', date)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

/** POST /api/food-logs — create a new food log entry */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as Partial<FoodLogInsert>

  if (!body.food_name?.trim()) {
    return NextResponse.json({ error: 'food_name is required' }, { status: 400 })
  }
  if (body.calories === undefined || body.calories < 0) {
    return NextResponse.json({ error: 'calories must be >= 0' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id:             user.id,
      logged_date:         body.logged_date ?? localTodayFromCookies(),
      meal_type:           body.meal_type ?? 'snack',
      food_name:           body.food_name.trim(),
      serving_description: body.serving_description?.trim() || null,
      calories:            body.calories,
      protein_g:           body.protein_g ?? 0,
      carbs_g:             body.carbs_g   ?? 0,
      fat_g:               body.fat_g     ?? 0,
      fiber_g:             body.fiber_g   ?? null,
      sugar_g:             body.sugar_g   ?? null,
      sodium_mg:           body.sodium_mg ?? null,
      saved_meal_id:       body.saved_meal_id ?? null,
      notes:               body.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
